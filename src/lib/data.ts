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

const ANNOUNCEMENT_SELECT = `
  *,
  categories ( id, name, slug, color ),
  organizations ( id, name, slug, logo_url )
` as const

export async function getPublicAnnouncements(categorySlug?: string): Promise<AnnouncementWithRelations[]> {
  const supabase = await createClient()

  let query = supabase
    .from('announcements')
    .select(ANNOUNCEMENT_SELECT)
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (categorySlug) {
    query = query.eq('categories.slug', categorySlug)
  }

  const { data, error } = await query
  if (error) {
    console.error('[getPublicAnnouncements]', error.message, error.code)
    return []
  }
  return sortAnnouncementsForFeed((data ?? []) as AnnouncementWithRelations[])
}

export async function getAnnouncementById(id: string): Promise<AnnouncementWithRelations | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('announcements')
    .select(ANNOUNCEMENT_SELECT)
    .eq('id', id)
    .eq('status', 'published')
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
    console.error('[getActiveCategories]', error.message, error.code)
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

  const { data } = await query
  return (data ?? []) as AnnouncementForReview[]
}

export async function getAnnouncementForReview(id: string): Promise<AnnouncementForReview | null> {
  const access = await getCurrentAccessContext()
  if (!access || !canAccessAdminArea(access.role)) return null

  const supabase = await createClient()
  const { data } = await supabase
    .from('announcements')
    .select(REVIEW_SELECT)
    .eq('id', id)
    .single()

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

  const { data } = await query
  return data ?? []
}

export async function getOrgWithMembers(orgId: string): Promise<OrgWithMembers | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('organizations')
    .select('*, organization_members ( user_id, member_role, users ( display_name, email ) )')
    .eq('id', orgId)
    .single()
  return data as OrgWithMembers | null
}

export async function getAllPublishers(): Promise<PublisherWithOrgs[]> {
  const access = await getCurrentAccessContext()
  if (!access || !canAccessAdminArea(access.role)) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from('users')
    .select('*, organization_members ( organization_id, member_role, organizations ( name, slug ) )')
    .eq('role', 'publisher')
    .order('created_at', { ascending: false })

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

  let pendingReviewQuery = supabase.from('announcements').select('*', { count: 'exact', head: true }).eq('status', 'submitted')
  let publishedThisMonthQuery = supabase
      .from('announcements')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')
      .gte('published_at', monthStart)
  let totalOrgsQuery = supabase.from('organizations').select('*', { count: 'exact', head: true }).eq('status', 'approved')

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

  const [{ count: pendingReview }, { count: publishedThisMonth }, { count: totalOrgs }, { data: publishers }] = await Promise.all([
    pendingReviewQuery,
    publishedThisMonthQuery,
    totalOrgsQuery,
    supabase
      .from('users')
      .select('id, role, organization_members ( organization_id )')
      .eq('role', 'publisher'),
  ])

  const totalPublishers = access.role === 'admin'
    ? (publishers ?? []).filter((publisher) =>
        (publisher.organization_members ?? []).some((membership) => access.orgIds.includes(membership.organization_id))
      ).length
    : publishers?.length ?? 0

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
  const { data } = await supabase
    .from('users')
    .select('*, organization_members ( organization_id )')
    .in('role', ['admin', 'publisher'])
    .order('created_at', { ascending: false })

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
      orgIds: (user.organization_members ?? []).map((membership: { organization_id: string }) => membership.organization_id),
    })
  )
}

// ─── Super Admin ──────────────────────────────────────────────

export async function getAllUsers() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function getAllAdmins() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('users')
    .select('*')
    .in('role', ['admin', 'super_admin'])
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function getAllCategoriesAdmin() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('categories')
    .select('*')
    .order('name')
  return data ?? []
}

export async function getPlatformStats() {
  const supabase = await createClient()
  const [
    { count: totalAnnouncements },
    { count: publishedCount },
    { count: pendingReview },
    { count: totalOrgs },
    { count: totalUsers },
  ] = await Promise.all([
    supabase.from('announcements').select('*', { count: 'exact', head: true }),
    supabase.from('announcements').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('announcements').select('*', { count: 'exact', head: true }).eq('status', 'submitted'),
    supabase.from('organizations').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }),
  ])
  return {
    totalAnnouncements: totalAnnouncements ?? 0,
    publishedCount: publishedCount ?? 0,
    pendingReview: pendingReview ?? 0,
    totalOrgs: totalOrgs ?? 0,
    totalUsers: totalUsers ?? 0,
  }
}
