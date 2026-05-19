import { createClient, createServiceClient } from './supabase/server'
import {
  canAccessAdminArea,
  canViewUser,
  getCurrentAccessContext,
  type ScopedUser,
} from './auth/authz'
import type {
  AnnouncementWithRelations,
  AnnouncementForReview,
  DbCategory,
  OrgWithMembers,
  PublisherWithOrgs,
} from './types'
import { sortAnnouncementsForFeed } from './announcements/presentation'
import { announcementLookupId } from './announcements/urls'
import { reportServerError } from '@/lib/error-reporting'

const ANNOUNCEMENT_SELECT = `
  *,
  categories ( id, name, slug, color ),
  organizations ( id, name, slug, logo_url )
` as const

const ANNOUNCEMENT_SELECT_WITH_CATEGORY_FILTER = `
  *,
  categories!inner ( id, name, slug, color ),
  organizations ( id, name, slug, logo_url )
` as const

const PUBLIC_FEED_LIMIT = 80

function errorCode(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined
  const value = (error as Record<string, unknown>).code
  return typeof value === 'string' ? value : undefined
}

function isNoRowsError(error: unknown) {
  return errorCode(error) === 'PGRST116'
}

function normalizePublicSearchQuery(query?: string): string {
  return (query ?? '')
    .trim()
    .replace(/[%,()]/g, ' ')
    .replace(/\s+/g, ' ')
    .slice(0, 80)
}

export async function getPublicAnnouncements(
  categorySlug?: string,
  searchQuery?: string
): Promise<AnnouncementWithRelations[]> {
  const supabase = await createClient()
  const now = new Date().toISOString()
  const search = normalizePublicSearchQuery(searchQuery)

  let query = supabase
    .from('announcements')
    .select(categorySlug ? ANNOUNCEMENT_SELECT_WITH_CATEGORY_FILTER : ANNOUNCEMENT_SELECT)
    .eq('status', 'published')
    .or(`scheduled_publish_at.is.null,scheduled_publish_at.lte.${now}`)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('published_at', { ascending: false })
    .limit(PUBLIC_FEED_LIMIT)

  if (categorySlug) {
    query = query.eq('categories.slug', categorySlug)
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,body.ilike.%${search}%`)
  }

  const { data, error } = await query
  if (error) {
    reportServerError('data.public_announcements.query_failed', error, {
      categorySlug: categorySlug ?? null,
      hasSearch: Boolean(search),
    })
    return []
  }
  return sortAnnouncementsForFeed((data ?? []) as AnnouncementWithRelations[])
}

export async function getAnnouncementById(id: string): Promise<AnnouncementWithRelations | null> {
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
  return data as AnnouncementWithRelations
}

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

// ─── Admin ────────────────────────────────────────────────────

const REVIEW_SELECT = `
  *,
  categories ( name, slug, color ),
  organizations ( name, slug ),
  users ( display_name, email )
` as const

export async function getSubmittedAnnouncements(): Promise<AnnouncementForReview[]> {
  const access = await getCurrentAccessContext()
  if (!access || !canAccessAdminArea(access.role)) return []

  const supabase = await createClient()
  let query = supabase
    .from('announcements')
    .select(REVIEW_SELECT)
    .eq('status', 'submitted')
    .order('updated_at', { ascending: true })

  if (access.role === 'admin') {
    if (access.orgIds.length === 0) return []
    query = query.in('organization_id', access.orgIds)
  }

  const { data, error: submittedAnnouncementsError } = await query
  if (submittedAnnouncementsError) {
    reportServerError('data.submitted_announcements.query_failed', submittedAnnouncementsError, {
      actorId: access.userId,
      role: access.role,
      orgCount: access.orgIds.length,
    })
    return []
  }
  return (data ?? []) as AnnouncementForReview[]
}

export async function getAnnouncementForReview(id: string): Promise<AnnouncementForReview | null> {
  const access = await getCurrentAccessContext()
  if (!access || !canAccessAdminArea(access.role)) return null

  const supabase = await createClient()
  const { data, error: reviewAnnouncementError } = await supabase
    .from('announcements')
    .select(REVIEW_SELECT)
    .eq('id', id)
    .single()

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

  if (!data) return null
  if (access.role === 'admin' && !access.orgIds.includes(data.organization_id)) return null

  return data as AnnouncementForReview | null
}

export async function getAllOrganizations() {
  const access = await getCurrentAccessContext()
  if (!access || !canAccessAdminArea(access.role)) return []

  if (access.role === 'admin' && access.orgIds.length === 0) return []

  const supabase = await createClient()
  let query = supabase
    .from('organizations')
    .select('*, users ( display_name, email )')
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
  return data ?? []
}

export async function getOrgWithMembers(orgId: string): Promise<OrgWithMembers | null> {
  const supabase = await createClient()
  const { data, error: orgWithMembersError } = await supabase
    .from('organizations')
    .select('*, organization_members ( user_id, member_role, users ( display_name, email ) )')
    .eq('id', orgId)
    .single()

  if (orgWithMembersError) {
    if (!isNoRowsError(orgWithMembersError)) {
      reportServerError('data.organization_with_members.query_failed', orgWithMembersError, {
        organizationId: orgId,
      })
    }
    return null
  }

  return data as OrgWithMembers | null
}

export async function getAllPublishers(): Promise<PublisherWithOrgs[]> {
  const access = await getCurrentAccessContext()
  if (!access || !canAccessAdminArea(access.role)) return []

  const supabase = await createClient()
  const { data, error: publishersError } = await supabase
    .from('users')
    .select(
      '*, organization_members ( organization_id, member_role, organizations ( name, slug ) )'
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

  if (access.role !== 'admin') return (data ?? []) as PublisherWithOrgs[]

  return ((data ?? []) as PublisherWithOrgs[])
    .map((publisher) => ({
      ...publisher,
      organization_members: (publisher.organization_members ?? []).filter((membership) =>
        access.orgIds.includes(membership.organization_id)
      ),
    }))
    .filter((publisher) => publisher.organization_members.length > 0)
}

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
    .select('*', { count: 'exact', head: true })
    .eq('status', 'submitted')
  let publishedThisMonthQuery = supabase
    .from('announcements')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published')
    .gte('published_at', monthStart)
  let totalOrgsQuery = supabase
    .from('organizations')
    .select('*', { count: 'exact', head: true })
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

export async function getVisibleUsersForAdmin() {
  const access = await getCurrentAccessContext()
  if (!access || !canAccessAdminArea(access.role)) return []

  const supabase = await createServiceClient()
  const { data, error: visibleUsersError } = await supabase
    .from('users')
    .select('*, organization_members ( organization_id )')
    .in('role', ['admin', 'publisher'])
    .order('created_at', { ascending: false })

  if (visibleUsersError) {
    reportServerError('data.visible_users.query_failed', visibleUsersError, {
      actorId: access.userId,
      role: access.role,
      orgCount: access.orgIds.length,
    })
    return []
  }

  if (!data) return []
  if (access.role !== 'admin') return data

  const actor: ScopedUser = {
    id: access.userId,
    role: access.role,
    orgIds: access.orgIds,
  }

  return data.filter((user) =>
    canViewUser(actor, {
      id: user.id,
      role: user.role,
      orgIds: (user.organization_members ?? []).map(
        (membership: { organization_id: string }) => membership.organization_id
      ),
    })
  )
}

// ─── Super Admin ──────────────────────────────────────────────

export async function getAllAdmins() {
  const supabase = await createClient()
  const { data, error: adminsError } = await supabase
    .from('users')
    .select('*')
    .in('role', ['admin', 'super_admin'])
    .order('created_at', { ascending: false })

  if (adminsError) {
    reportServerError('data.admins.query_failed', adminsError)
    return []
  }

  return data ?? []
}

export async function getPlatformStats() {
  const supabase = await createClient()
  const [
    totalAnnouncementsResult,
    publishedCountResult,
    pendingReviewResult,
    totalOrgsResult,
    totalUsersResult,
  ] = await Promise.all([
    supabase.from('announcements').select('*', { count: 'exact', head: true }),
    supabase
      .from('announcements')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published'),
    supabase
      .from('announcements')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'submitted'),
    supabase.from('organizations').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }),
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
