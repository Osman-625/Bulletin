import type { MetadataRoute } from 'next'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { announcementPath } from '@/lib/announcements/urls'
import { reportServerError } from '@/lib/error-reporting'
import { getCanonicalSiteUrl } from '@/lib/site'

type SitemapAnnouncement = {
  id: string
  title: string
  updated_at: string | null
  published_at: string | null
}

async function getSitemapAnnouncements(): Promise<SitemapAnnouncement[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) return []

  const supabase = createSupabaseClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('announcements')
    .select('id,title,updated_at,published_at')
    .eq('status', 'published')
    .or(`scheduled_publish_at.is.null,scheduled_publish_at.lte.${now}`)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('published_at', { ascending: false })

  if (error) {
    reportServerError('sitemap.announcements_query_failed', error)
    return []
  }

  return (data ?? []) as SitemapAnnouncement[]
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getCanonicalSiteUrl()
  const now = new Date()
  let announcementEntries: MetadataRoute.Sitemap = []

  try {
    const announcements = await getSitemapAnnouncements()
    announcementEntries = announcements.map((announcement) => ({
      url: `${siteUrl}${announcementPath(announcement)}`,
      lastModified: announcement.updated_at
        ? new Date(announcement.updated_at)
        : announcement.published_at
          ? new Date(announcement.published_at)
          : now,
      changeFrequency: 'weekly',
      priority: 0.7,
    }))
  } catch (error) {
    reportServerError('sitemap.generate_failed', error)
  }

  return [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    ...announcementEntries,
  ]
}
