/**
 * @module data
 * @description Server-side data access layer for the Bulletin platform.
 *
 * All functions in this module execute on the server and communicate directly
 * with Supabase. Access control is enforced at the query level using the
 * caller's role and organization memberships from `getCurrentAccessContext()`.
 *
 * Sections:
 *   - Public API  — unauthenticated announcement feed and category lookups
 *   - Admin       — moderation queue and user/org management (admin + super_admin)
 *   - Super Admin — platform-wide statistics and admin roster
 */

import {
  ANNOUNCEMENT_REVIEW_COLUMNS,
  ORGANIZATION_COLUMNS,
  USER_PROFILE_COLUMNS,
} from '@/infrastructure/database/columns'
import { createClient, createServiceClient } from '@/infrastructure/database/server'
import {
  canAccessAdminArea,
  canAccessSuperAdminArea,
  getCurrentAccessContext,
} from '@/modules/auth/authz'
import type {
  PublicAnnouncement,
  PublicAnnouncementDetail,
  AnnouncementForReview,
  DbCategory,
  OrgWithOwner,
  PublisherWithOrgs,
} from '@/shared/types'
import {
  daysUntilDeadline,
  isIssuedToday,
  normalizeBoardSort,
  paginatePublicBoardItems,
  type BoardSort,
} from '@/modules/announcements/public-board'
import { announcementLookupId } from '@/modules/announcements/urls'
import { reportServerError } from '@/shared/errors/error-reporting'

/** Selects announcement fields with category and organization relations (left join). */
const ANNOUNCEMENT_SELECT = `
  id,
  title,
  body,
  banner_url,
  urgency,
  display_font,
  display_size,
  category_id,
  organization_id,
  registration_link,
  scheduled_publish_at,
  pinned_until,
  published_at,
  expires_at,
  categories ( id, name, slug, color ),
  organizations ( id, name, slug, logo_url )
` as const

const PUBLIC_ANNOUNCEMENT_SELECT = `
  id,
  title,
  body,
  banner_url,
  urgency,
  display_font,
  display_size,
  registration_link,
  scheduled_publish_at,
  pinned_until,
  published_at,
  expires_at,
  categories ( id, name, slug, color ),
  organizations ( id, name, slug, logo_url )
` as const

const PUBLIC_ANNOUNCEMENT_SELECT_WITH_CATEGORY_FILTER = `
  id,
  title,
  body,
  banner_url,
  urgency,
  display_font,
  display_size,
  registration_link,
  scheduled_publish_at,
  pinned_until,
  published_at,
  expires_at,
  categories!inner ( id, name, slug, color ),
  organizations ( id, name, slug, logo_url )
` as const

const PUBLIC_FEED_PAGE_SIZE = 24
const PUBLIC_FEED_SAFE_IN_MEMORY_LIMIT = 500
const USER_MANAGEMENT_PAGE_SIZE = 24

/** Paginated result for the public announcement feed. */
type PublicAnnouncementsPage = {
  items: PublicAnnouncement[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  error: string | null
  /** Computed over the full filtered result set, not just the current page. */
  stats: {
    latest: PublicAnnouncement | null
    closingThisWeek: number
    publishedToday: number
  }
}

const EMPTY_PUBLIC_FEED_STATS: PublicAnnouncementsPage['stats'] = {
  latest: null,
  closingThisWeek: 0,
  publishedToday: 0,
}

type PublicAnnouncementCategory = NonNullable<PublicAnnouncement['categories']>
type PublicAnnouncementOrganization = NonNullable<PublicAnnouncement['organizations']>
type PublicAnnouncementQueryRow = Omit<PublicAnnouncement, 'categories' | 'organizations'> & {
  categories: PublicAnnouncementCategory | PublicAnnouncementCategory[] | null
  organizations: PublicAnnouncementOrganization | PublicAnnouncementOrganization[] | null
}

/** Generic paginated result for user management tables; includes per-role counts. */
type UserManagementPage<T> = {
  items: T[]
  total: number
  /** Total across all roles, unaffected by the current role filter. */
  allTotal: number
  roleCounts: Record<string, number>
  page: number
  pageSize: number
  totalPages: number
}

/** Extracts the `code` field from a Supabase/PostgREST error object, if present. */
function errorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined
  const value = (error as Record<string, unknown>).code
  return typeof value === 'string' ? value : undefined
}

/** Returns true when the PostgREST error code indicates zero rows were returned (PGRST116). */
function isNoRowsError(error: unknown) {
  return errorCode(error) === 'PGRST116'
}

/**
 * Sanitizes a free-text search query for safe use in an `ilike` Supabase filter.
 *
 * Strips SQL wildcard and grouping characters `%`, `,`, `(`, `)`, collapses
 * consecutive whitespace, and truncates to 80 characters to prevent runaway queries.
 */
function normalizePublicSearchQuery(query?: string): string {
  return (query ?? '')
    .trim()
    .replace(/[%,()]/g, ' ')
    .replace(/\s+/g, ' ')
    .slice(0, 80)
}

/**
 * Parses and clamps a page number from URL search params.
 * Falls back to page 1 for any non-positive or non-finite input.
 */
function normalizePageInput(pageInput?: string | number | null) {
  const parsedPage =
    typeof pageInput === 'number' ? pageInput : Number.parseInt(pageInput ?? '1', 10)
  return Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1
}

function singleRelation<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value
}

function normalizePublicAnnouncementRows(rows: PublicAnnouncementQueryRow[]): PublicAnnouncement[] {
  return rows.map((row) => ({
    ...row,
    categories: singleRelation(row.categories),
    organizations: singleRelation(row.organizations),
  }))
}

/**
 * Fetches a paginated page of published announcements for the public feed.
 *
 * Filters out announcements that have not yet reached their `scheduled_publish_at`
 * date or have passed their `expires_at` date. Results are post-sorted by
 * `paginatePublicBoardItems` after the DB query to apply custom feed ordering
 * before slicing the requested page.
 *
 * @param categorySlug - When provided, restricts results to a single category.
 * @param searchQuery  - Raw user input; sanitized before use in the `ilike` filter.
 * @param pageInput    - 1-based page number (string or number); invalid values fall back to 1.
 * @returns A page of announcements with pagination metadata. Returns an empty page on error.
 */
export async function getPublicAnnouncements(
  categorySlug?: string,
  searchQuery?: string,
  pageInput?: string | number | null,
  sortInput?: BoardSort | string,
  nowInput = Date.now()
): Promise<PublicAnnouncementsPage> {
  const supabase = await createClient()
  const now = new Date(nowInput).toISOString()
  const search = normalizePublicSearchQuery(searchQuery)
  const page = normalizePageInput(pageInput)
  const activeSort = normalizeBoardSort(sortInput)

  let query = supabase
    .from('announcements')
    .select(
      categorySlug ? PUBLIC_ANNOUNCEMENT_SELECT_WITH_CATEGORY_FILTER : PUBLIC_ANNOUNCEMENT_SELECT
    )
    .eq('status', 'published')
    .is('archived_at', null)
    .or(`scheduled_publish_at.is.null,scheduled_publish_at.lte.${now}`)
    .or(`expires_at.is.null,expires_at.gt.${now}`)

  if (categorySlug) {
    query = query.eq('categories.slug', categorySlug)
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,body.ilike.%${search}%`)
  }

  // shortcut: only the newest 500 live notices are ordered in memory, move board ordering into a
  // DB view/RPC before the board needs to show more.
  const { data, error } = await query
    .order('published_at', { ascending: false })
    .limit(PUBLIC_FEED_SAFE_IN_MEMORY_LIMIT)

  if (error) {
    reportServerError('data.public_announcements.query_failed', error, {
      categorySlug: categorySlug ?? null,
      hasSearch: Boolean(search),
      page,
      sort: activeSort,
    })
    return {
      items: [],
      total: 0,
      page,
      pageSize: PUBLIC_FEED_PAGE_SIZE,
      totalPages: 1,
      error: 'public_announcements_query_failed',
      stats: EMPTY_PUBLIC_FEED_STATS,
    }
  }

  const publicAnnouncements = normalizePublicAnnouncementRows(
    (data ?? []) as unknown as PublicAnnouncementQueryRow[]
  )

  const pageResult = paginatePublicBoardItems(publicAnnouncements, {
    sort: activeSort,
    page,
    pageSize: PUBLIC_FEED_PAGE_SIZE,
    now: nowInput,
  })

  return {
    ...pageResult,
    error: null,
    stats: {
      // The query is ordered by published_at desc, so the first row is the
      // newest published notice across the whole filtered set.
      latest: publicAnnouncements[0] ?? null,
      closingThisWeek: publicAnnouncements.filter((announcement) => {
        const days = daysUntilDeadline(announcement.expires_at, nowInput)
        return days !== null && days <= 7
      }).length,
      publishedToday: publicAnnouncements.filter((announcement) =>
        isIssuedToday(announcement.published_at, nowInput)
      ).length,
    },
  }
}

/**
 * Fetches a single published announcement by its ID.
 *
 * Respects `scheduled_publish_at` and `expires_at` visibility windows — returns
 * `null` for announcements that are not yet live or have expired.
 *
 * @param id - The announcement UUID (or slug-encoded lookup ID via `announcementLookupId`).
 * @returns The announcement with category and organization relations, or `null` if not found.
 */
export async function getAnnouncementById(id: string): Promise<PublicAnnouncementDetail | null> {
  const supabase = await createClient()
  const now = new Date().toISOString()
  const lookupId = announcementLookupId(id)
  const { data, error } = await supabase
    .from('announcements')
    .select(ANNOUNCEMENT_SELECT)
    .eq('id', lookupId)
    .eq('status', 'published')
    .or(`scheduled_publish_at.is.null,scheduled_publish_at.lte.${now}`)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .single()

  if (error) return null
  return data as unknown as PublicAnnouncementDetail
}

/**
 * Returns all active categories ordered alphabetically by name.
 * Used to populate the category filter on the public feed.
 *
 * @returns Array of active categories, or an empty array on error.
 */
export async function getActiveCategories(): Promise<DbCategory[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, color')
    .eq('is_active', true)
    .order('name')

  if (error) {
    reportServerError('data.active_categories.query_failed', error)
    return []
  }
  return (data ?? []) as DbCategory[]
}

const VIEW_COUNT_PAGE_SIZE = 1000

/**
 * Sums `view_count` across announcements, optionally limited to some organizations.
 * Pages through the rows because a single select stops silently at the API row cap.
 */
export async function sumAnnouncementViews(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgIds: string[] | null
): Promise<number> {
  let total = 0

  for (let from = 0; ; from += VIEW_COUNT_PAGE_SIZE) {
    let query = supabase
      .from('announcements')
      .select('view_count')
      .order('id')
      .range(from, from + VIEW_COUNT_PAGE_SIZE - 1)
    if (orgIds) query = query.in('organization_id', orgIds)

    const { data, error } = await query
    if (error) {
      reportServerError('data.announcement_views.query_failed', error, { from })
      return 0
    }

    total += data.reduce((sum, row) => sum + (row.view_count ?? 0), 0)
    if (data.length < VIEW_COUNT_PAGE_SIZE) return total
  }
}

// ─── Admin ────────────────────────────────────────────────────

const REVIEW_SELECT = `
  ${ANNOUNCEMENT_REVIEW_COLUMNS},
  categories ( name, slug, color ),
  organizations ( name, slug ),
  users ( display_name, email )
` as const

async function getAnnouncementsForReview(
  status: 'submitted' | 'published',
  { ascending, limit }: { ascending: boolean; limit?: number }
): Promise<AnnouncementForReview[]> {
  const access = await getCurrentAccessContext()
  if (!access || !canAccessAdminArea(access.role)) return []

  const supabase = await createClient()
  let query = supabase
    .from('announcements')
    .select(REVIEW_SELECT)
    .eq('status', status)
    .order('updated_at', { ascending })

  if (limit) query = query.limit(limit)
  if (access.role === 'admin') {
    if (access.orgIds.length === 0) return []
    query = query.in('organization_id', access.orgIds)
  }

  const { data, error: reviewListError } = await query
  if (reviewListError) {
    reportServerError(`data.${status}_announcements.query_failed`, reviewListError, {
      actorId: access.userId,
      role: access.role,
      orgCount: access.orgIds.length,
    })
    return []
  }
  return (data ?? []) as unknown as AnnouncementForReview[]
}

/**
 * Returns all announcements in `submitted` status awaiting moderation, oldest first.
 *
 * Access is role-scoped: `admin` sees only announcements belonging to their
 * assigned organizations; `super_admin` sees all. Returns an empty array if
 * the caller lacks admin access or has no assigned organizations.
 */
export function getSubmittedAnnouncements() {
  return getAnnouncementsForReview('submitted', { ascending: true })
}

const LIVE_ANNOUNCEMENTS_REVIEW_LIMIT = 50

/** The most recently changed live announcements, so an admin can take one down. Same scoping. */
export function getLiveAnnouncements() {
  return getAnnouncementsForReview('published', {
    ascending: false,
    limit: LIVE_ANNOUNCEMENTS_REVIEW_LIMIT,
  })
}

/**
 * Fetches a single announcement by ID for the admin review workflow.
 *
 * Unlike `getAnnouncementById`, this does not filter by published status or
 * visibility windows — it is used to review announcements in any workflow state.
 *
 * Access enforcement: `admin` callers can only access announcements from their
 * own organizations; `super_admin` can access any.
 *
 * @param id - The announcement UUID.
 * @returns The announcement with review-relevant relations, or `null` if unauthorized or not found.
 */
export async function getAnnouncementForReview(id: string): Promise<AnnouncementForReview | null> {
  const access = await getCurrentAccessContext()
  if (!access || !canAccessAdminArea(access.role)) return null

  if (access.role === 'admin' && access.orgIds.length === 0) return null

  const supabase = await createClient()
  let query = supabase.from('announcements').select(REVIEW_SELECT).eq('id', id)

  if (access.role === 'admin') {
    query = query.in('organization_id', access.orgIds)
  }

  const { data, error: reviewAnnouncementError } = await query.single()

  if (reviewAnnouncementError) {
    if (!isNoRowsError(reviewAnnouncementError)) {
      reportServerError('data.review_announcement.query_failed', reviewAnnouncementError, {
        actorId: access.userId,
        role: access.role,
        announcementId: id,
      })
    }
    return null
  }

  return (data ?? null) as unknown as AnnouncementForReview | null
}

/**
 * Returns all organizations with their owner user details.
 *
 * `admin` callers receive only organizations they are members of;
 * `owner` callers receive all organizations platform-wide.
 * Ordered newest-first.
 *
 * @returns Array of organizations with nested user relations, or empty array on error.
 */
export async function getAllOrganizations(): Promise<OrgWithOwner[]> {
  const access = await getCurrentAccessContext()
  if (!access || !canAccessAdminArea(access.role)) return []

  if (access.role === 'admin' && access.orgIds.length === 0) return []

  const supabase = await createClient()
  let query = supabase
    .from('organizations')
    .select(
      `${ORGANIZATION_COLUMNS}, owner:users!organizations_owner_id_fkey ( display_name, email )` as const
    )
    .order('created_at', { ascending: false })

  if (access.role === 'admin') {
    query = query.in('id', access.orgIds)
  }

  const { data, error: organizationsError } = await query
  if (organizationsError) {
    reportServerError('data.organizations.query_failed', organizationsError, {
      actorId: access.userId,
      role: access.role,
      orgCount: access.orgIds.length,
    })
    return []
  }
  return (data ?? []) as unknown as OrgWithOwner[]
}

/**
 * Returns all users with the `publisher` role, including their organization memberships.
 *
 * `admin` callers receive only publishers who belong to at least one of the caller's
 * organizations, with memberships filtered to those organizations only.
 * `owner` callers receive all publishers platform-wide.
 *
 * @returns Array of publishers with nested organization relations, or empty array on error.
 */
export async function getAllPublishers(): Promise<PublisherWithOrgs[]> {
  const access = await getCurrentAccessContext()
  if (!access || !canAccessAdminArea(access.role)) return []

  if (access.role === 'admin' && access.orgIds.length === 0) return []

  const supabase = await createClient()

  if (access.role === 'admin') {
    // Fetch only publisher user IDs that belong to the admin's orgs, then
    // query those users with their filtered memberships. Avoids loading all
    // publishers into memory for JS-side org filtering.
    const { data: memberships, error: membershipError } = await supabase
      .from('organization_members')
      .select('user_id')
      .in('organization_id', access.orgIds)

    if (membershipError) {
      reportServerError('data.publishers.membership_query_failed', membershipError, {
        actorId: access.userId,
        role: access.role,
        orgCount: access.orgIds.length,
      })
      return []
    }

    const publisherIds = [...new Set((memberships ?? []).map((m) => m.user_id))]
    if (publisherIds.length === 0) return []

    const { data, error: publishersError } = await supabase
      .from('users')
      .select(
        `${USER_PROFILE_COLUMNS}, organization_members ( organization_id, member_role, organizations ( name, slug ) )` as const
      )
      .eq('role', 'publisher')
      .in('id', publisherIds)
      .order('created_at', { ascending: false })

    if (publishersError) {
      reportServerError('data.publishers.query_failed', publishersError, {
        actorId: access.userId,
        role: access.role,
        orgCount: access.orgIds.length,
      })
      return []
    }

    return ((data ?? []) as unknown as PublisherWithOrgs[]).map((publisher) => ({
      ...publisher,
      organization_members: (publisher.organization_members ?? []).filter((m) =>
        access.orgIds.includes(m.organization_id)
      ),
    }))
  }

  const { data, error: publishersError } = await supabase
    .from('users')
    .select(
      `${USER_PROFILE_COLUMNS}, organization_members ( organization_id, member_role, organizations ( name, slug ) )` as const
    )
    .eq('role', 'publisher')
    .order('created_at', { ascending: false })

  if (publishersError) {
    reportServerError('data.publishers.query_failed', publishersError, {
      actorId: access.userId,
      role: access.role,
      orgCount: access.orgIds.length,
    })
    return []
  }

  return (data ?? []) as unknown as PublisherWithOrgs[]
}

/**
 * Fetches summary statistics for the admin dashboard.
 *
 * Runs four parallel Supabase queries (pending review count, published-this-month
 * count, approved org count, publisher list) and aggregates the results.
 *
 * `admin` callers see stats scoped to their assigned organizations.
 * `owner` callers see platform-wide figures.
 *
 * @returns `{ pendingReview, publishedThisMonth, totalOrgs, totalPublishers }`.
 *          All values default to 0 on partial query failure.
 */
export async function getAdminStats() {
  const access = await getCurrentAccessContext()
  if (!access || !canAccessAdminArea(access.role)) {
    return {
      pendingReview: 0,
      publishedThisMonth: 0,
      totalOrgs: 0,
      totalPublishers: 0,
    }
  }

  const supabase = await createClient()
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

  let pendingReviewQuery = supabase
    .from('announcements')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'submitted')
  let publishedThisMonthQuery = supabase
    .from('announcements')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published')
    .gte('published_at', monthStart)
  let totalOrgsQuery = supabase
    .from('organizations')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'approved')

  if (access.role === 'admin') {
    if (access.orgIds.length === 0) {
      return {
        pendingReview: 0,
        publishedThisMonth: 0,
        totalOrgs: 0,
        totalPublishers: 0,
      }
    }

    pendingReviewQuery = pendingReviewQuery.in('organization_id', access.orgIds)
    publishedThisMonthQuery = publishedThisMonthQuery.in('organization_id', access.orgIds)
    totalOrgsQuery = totalOrgsQuery.in('id', access.orgIds)
  }

  const [
    pendingReviewResult,
    publishedThisMonthResult,
    totalOrgsResult,
    adminStatsPublishersResult,
  ] = await Promise.all([
    pendingReviewQuery,
    publishedThisMonthQuery,
    totalOrgsQuery,
    supabase
      .from('users')
      .select('id, role, organization_members ( organization_id )')
      .eq('role', 'publisher'),
  ])

  const { count: pendingReview, error: pendingReviewError } = pendingReviewResult
  const { count: publishedThisMonth, error: publishedThisMonthError } = publishedThisMonthResult
  const { count: totalOrgs, error: totalOrgsError } = totalOrgsResult
  const { data: publishers, error: adminStatsPublishersError } = adminStatsPublishersResult
  const adminStatsError =
    pendingReviewError ?? publishedThisMonthError ?? totalOrgsError ?? adminStatsPublishersError

  if (adminStatsError) {
    reportServerError('data.admin_stats.query_failed', adminStatsError, {
      actorId: access.userId,
      role: access.role,
      pendingReviewFailed: Boolean(pendingReviewError),
      publishedThisMonthFailed: Boolean(publishedThisMonthError),
      totalOrgsFailed: Boolean(totalOrgsError),
      publishersFailed: Boolean(adminStatsPublishersError),
    })
  }

  const totalPublishers =
    access.role === 'admin'
      ? (publishers ?? []).filter((publisher) =>
          (publisher.organization_members ?? []).some((membership) =>
            access.orgIds.includes(membership.organization_id)
          )
        ).length
      : (publishers?.length ?? 0)

  return {
    pendingReview: pendingReview ?? 0,
    publishedThisMonth: publishedThisMonth ?? 0,
    totalOrgs: totalOrgs ?? 0,
    totalPublishers,
  }
}

/**
 * Returns a paginated list of `admin` and `publisher` users visible to the caller.
 *
 * Uses the caller session client except for owner requests, where the owner UI
 * needs platform-wide user visibility beyond normal RLS grants. Computes
 * per-role counts independently of the current role filter so the UI can show
 * unfiltered totals in the tab bar.
 *
 * @param options.role  - Optional role filter; must be `"admin"` or `"publisher"`.
 * @param options.page  - 1-based page number; invalid input falls back to 1.
 * @returns Paginated page with role counts, or an empty page if unauthorized.
 */
export async function getVisibleUsersForAdminPage({
  role,
  page: pageInput,
}: {
  role?: string
  page?: string | number | null
} = {}): Promise<UserManagementPage<Record<string, unknown>>> {
  const access = await getCurrentAccessContext()
  const emptyPage = {
    items: [],
    total: 0,
    allTotal: 0,
    roleCounts: { admin: 0, publisher: 0 },
    page: normalizePageInput(pageInput),
    pageSize: USER_MANAGEMENT_PAGE_SIZE,
    totalPages: 1,
  }

  if (!access || !canAccessAdminArea(access.role)) return emptyPage
  if (access.role === 'admin' && access.orgIds.length === 0) return emptyPage

  const supabase = access.role === 'owner' ? await createServiceClient() : await createClient()
  const page = normalizePageInput(pageInput)
  const from = (page - 1) * USER_MANAGEMENT_PAGE_SIZE
  const to = from + USER_MANAGEMENT_PAGE_SIZE - 1
  const allowedRoles = ['admin', 'publisher'] as const
  const filterRole: (typeof allowedRoles)[number] | undefined =
    role && allowedRoles.includes(role as (typeof allowedRoles)[number])
      ? (role as (typeof allowedRoles)[number])
      : undefined

  let query = supabase
    .from('users')
    .select(`${USER_PROFILE_COLUMNS}, organization_members ( organization_id )` as const, {
      count: 'exact',
    })
    .in('role', [...allowedRoles])
    .order('created_at', { ascending: false })

  if (access.role === 'admin') {
    query = supabase
      .from('users')
      .select(`${USER_PROFILE_COLUMNS}, organization_members!inner ( organization_id )` as const, {
        count: 'exact',
      })
      .in('role', [...allowedRoles])
      .in('organization_members.organization_id', access.orgIds)
      .order('created_at', { ascending: false })
  }

  if (filterRole) query = query.eq('role', filterRole)

  const roleCountEntries = await Promise.all(
    allowedRoles.map(async (candidateRole) => {
      const { count, error } =
        access.role === 'admin'
          ? await supabase
              .from('users')
              .select('id, organization_members!inner ( organization_id )', {
                count: 'exact',
                head: true,
              })
              .eq('role', candidateRole)
              .in('organization_members.organization_id', access.orgIds)
          : await supabase
              .from('users')
              .select('id', { count: 'exact', head: true })
              .eq('role', candidateRole)
      if (error) {
        reportServerError('data.visible_users_count.query_failed', error, {
          actorId: access.userId,
          role: access.role,
          countedRole: candidateRole,
          orgCount: access.orgIds.length,
        })
      }
      return [candidateRole, count ?? 0] as const
    })
  )
  const roleCounts = Object.fromEntries(roleCountEntries)
  const allTotal = Object.values(roleCounts).reduce((sum, count) => sum + count, 0)

  const { data, error: visibleUsersError, count } = await query.range(from, to)

  if (visibleUsersError) {
    reportServerError('data.visible_users.query_failed', visibleUsersError, {
      actorId: access.userId,
      role: access.role,
      orgCount: access.orgIds.length,
      filterRole: filterRole ?? null,
      page,
    })
    return {
      ...emptyPage,
      roleCounts,
      allTotal,
      page,
    }
  }

  const total = count ?? data?.length ?? 0
  return {
    items: (data ?? []) as Record<string, unknown>[],
    total,
    allTotal,
    roleCounts,
    page,
    pageSize: USER_MANAGEMENT_PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / USER_MANAGEMENT_PAGE_SIZE)),
  }
}

// ─── Super Admin ──────────────────────────────────────────────

/**
 * Returns all users with `admin` or `super_admin` roles, ordered newest-first.
 * Intended for the super-admin admin roster page.
 *
 * @returns Array of admin/super_admin user rows, or empty array on error.
 */
export async function getAllAdmins() {
  const access = await getCurrentAccessContext()
  if (!access || !canAccessSuperAdminArea(access.role)) return []

  const supabase = await createClient()
  const { data, error: adminsError } = await supabase
    .from('users')
    .select(USER_PROFILE_COLUMNS)
    .in('role', ['admin', 'super_admin'])
    .order('created_at', { ascending: false })

  if (adminsError) {
    reportServerError('data.admins.query_failed', adminsError)
    return []
  }

  return data ?? []
}

/**
 * Fetches platform-wide aggregate statistics for the super-admin dashboard.
 *
 * Runs five parallel Supabase count queries (total announcements, published,
 * pending review, total orgs, total users) and returns them as a flat object.
 *
 * @returns `{ totalAnnouncements, publishedCount, pendingReview, totalOrgs, totalUsers }`.
 *          All values default to 0 on partial query failure.
 */
export async function getPlatformStats() {
  const emptyPlatformStats = {
    totalAnnouncements: 0,
    publishedCount: 0,
    pendingReview: 0,
    totalOrgs: 0,
    totalUsers: 0,
  }
  const access = await getCurrentAccessContext()
  if (!access || !canAccessSuperAdminArea(access.role)) return emptyPlatformStats

  const supabase = await createClient()
  const [
    totalAnnouncementsResult,
    publishedCountResult,
    pendingReviewResult,
    totalOrgsResult,
    totalUsersResult,
  ] = await Promise.all([
    supabase.from('announcements').select('id', { count: 'exact', head: true }),
    supabase
      .from('announcements')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published'),
    supabase
      .from('announcements')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'submitted'),
    supabase.from('organizations').select('id', { count: 'exact', head: true }),
    supabase.from('users').select('id', { count: 'exact', head: true }),
  ])

  const { count: totalAnnouncements, error: totalAnnouncementsError } = totalAnnouncementsResult
  const { count: publishedCount, error: publishedCountError } = publishedCountResult
  const { count: pendingReview, error: platformPendingReviewError } = pendingReviewResult
  const { count: totalOrgs, error: platformTotalOrgsError } = totalOrgsResult
  const { count: totalUsers, error: totalUsersError } = totalUsersResult
  const platformStatsError =
    totalAnnouncementsError ??
    publishedCountError ??
    platformPendingReviewError ??
    platformTotalOrgsError ??
    totalUsersError

  if (platformStatsError) {
    reportServerError('data.platform_stats.query_failed', platformStatsError, {
      totalAnnouncementsFailed: Boolean(totalAnnouncementsError),
      publishedCountFailed: Boolean(publishedCountError),
      pendingReviewFailed: Boolean(platformPendingReviewError),
      totalOrgsFailed: Boolean(platformTotalOrgsError),
      totalUsersFailed: Boolean(totalUsersError),
    })
  }

  return {
    totalAnnouncements: totalAnnouncements ?? 0,
    publishedCount: publishedCount ?? 0,
    pendingReview: pendingReview ?? 0,
    totalOrgs: totalOrgs ?? 0,
    totalUsers: totalUsers ?? 0,
  }
}
