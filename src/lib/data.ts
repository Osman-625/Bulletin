import { createClient } from './supabase/server'
import type {
  AnnouncementWithRelations,
  AnnouncementForReview,
  DbCategory,
  OrgWithMembers,
  PublisherWithOrgs,
} from './types'

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
  return (data ?? []) as AnnouncementWithRelations[]
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
  const supabase = await createClient()
  const { data } = await supabase
    .from('announcements')
    .select(REVIEW_SELECT)
    .eq('status', 'submitted')
    .order('updated_at', { ascending: true })
  return (data ?? []) as AnnouncementForReview[]
}

export async function getAnnouncementForReview(id: string): Promise<AnnouncementForReview | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('announcements')
    .select(REVIEW_SELECT)
    .eq('id', id)
    .single()
  return data as AnnouncementForReview | null
}

export async function getAllOrganizations() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('organizations')
    .select('*, users ( display_name, email )')
    .order('created_at', { ascending: false })
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
  const supabase = await createClient()
  const { data } = await supabase
    .from('users')
    .select('*, organization_members ( organization_id, member_role, organizations ( name, slug ) )')
    .eq('role', 'publisher')
    .order('created_at', { ascending: false })
  return (data ?? []) as PublisherWithOrgs[]
}

export async function getAdminStats() {
  const supabase = await createClient()
  const [
    { count: pendingReview },
    { count: publishedThisMonth },
    { count: totalOrgs },
    { count: totalPublishers },
  ] = await Promise.all([
    supabase.from('announcements').select('*', { count: 'exact', head: true }).eq('status', 'submitted'),
    supabase
      .from('announcements')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')
      .gte('published_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    supabase.from('organizations').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'publisher'),
  ])
  return {
    pendingReview: pendingReview ?? 0,
    publishedThisMonth: publishedThisMonth ?? 0,
    totalOrgs: totalOrgs ?? 0,
    totalPublishers: totalPublishers ?? 0,
  }
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
