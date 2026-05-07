'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getWritableOrganizationId } from '@/lib/announcements/access'
import {
  normalizeAnnouncementDisplayFont,
  normalizeAnnouncementDisplaySize,
  normalizeAnnouncementUrgency,
} from '@/lib/announcements/presentation'
import { getCurrentAccessContext } from '@/lib/auth/authz'

export async function createAnnouncement(formData: FormData) {
  const supabase = await createClient()
  const access = await getCurrentAccessContext()
  if (!access) throw new Error('Unauthorized')

  const organizationId = await getWritableOrganizationId(supabase, access)
  if (!organizationId) throw new Error('No organization')

  const title = (formData.get('title') as string) || 'Untitled Announcement'
  const body = (formData.get('body') as string) || ''
  const categoryId = formData.get('category_id') as string | null
  const bannerUrl = formData.get('banner_url') as string | null
  const registrationLink = formData.get('registration_link') as string | null
  const expiresAt = formData.get('expires_at') as string | null
  const urgency = normalizeAnnouncementUrgency(formData.get('urgency'))
  const displayFont = normalizeAnnouncementDisplayFont(formData.get('display_font'))
  const displaySize = normalizeAnnouncementDisplaySize(formData.get('display_size'))

  const { data: announcement, error } = await supabase
    .from('announcements')
    .insert({
      title,
      body,
      status: 'draft',
      category_id: categoryId || null,
      organization_id: organizationId,
      author_id: access.userId,
      urgency,
      display_font: displayFont,
      display_size: displaySize,
      banner_url: bannerUrl || null,
      registration_link: registrationLink || null,
      expires_at: expiresAt || null,
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/announcements')
  redirect(`/dashboard/announcements/${announcement.id}/edit`)
}

export async function createAndPublishAnnouncement(formData: FormData) {
  const supabase = await createClient()
  const access = await getCurrentAccessContext()
  if (!access) throw new Error('Unauthorized')

  const organizationId = await getWritableOrganizationId(supabase, access)
  if (!organizationId) throw new Error('No organization')

  const title = (formData.get('title') as string) || 'Untitled Announcement'
  const body = (formData.get('body') as string) || ''
  const categoryId = formData.get('category_id') as string | null
  const bannerUrl = formData.get('banner_url') as string | null
  const registrationLink = formData.get('registration_link') as string | null
  const expiresAt = formData.get('expires_at') as string | null
  const urgency = normalizeAnnouncementUrgency(formData.get('urgency'))
  const displayFont = normalizeAnnouncementDisplayFont(formData.get('display_font'))
  const displaySize = normalizeAnnouncementDisplaySize(formData.get('display_size'))
  const now = new Date().toISOString()

  const { data: announcement, error } = await supabase
    .from('announcements')
    .insert({
      title,
      body,
      status: 'published',
      published_at: now,
      category_id: categoryId || null,
      organization_id: organizationId,
      author_id: access.userId,
      urgency,
      display_font: displayFont,
      display_size: displaySize,
      banner_url: bannerUrl || null,
      registration_link: registrationLink || null,
      expires_at: expiresAt || null,
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/announcements')
  redirect(`/dashboard/announcements/${announcement.id}/edit`)
}
