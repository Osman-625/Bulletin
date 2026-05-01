import { createClient } from './supabase/server'
import type { AnnouncementWithRelations, DbCategory } from './types'

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
