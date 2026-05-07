'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { canManageAnnouncementForOrg } from '@/lib/announcements/access'
import {
  normalizeAnnouncementDisplayFont,
  normalizeAnnouncementDisplaySize,
  normalizeAnnouncementUrgency,
} from '@/lib/announcements/presentation'
import { getCurrentAccessContext } from '@/lib/auth/authz'

async function verifyAnnouncementAccess(supabase: Awaited<ReturnType<typeof createClient>>, announcementId: string) {
  const access = await getCurrentAccessContext()
  if (!access) throw new Error('Unauthorized')

  const { data: announcement } = await supabase
    .from('announcements')
    .select('id, organization_id')
    .eq('id', announcementId)
    .single()

  if (!announcement) throw new Error('Announcement not found')
  if (!canManageAnnouncementForOrg(access, announcement.organization_id)) {
    throw new Error('Unauthorized: announcement belongs to a different organization')
  }

  return { organizationId: announcement.organization_id }
}

export async function updateAnnouncement(id: string, formData: FormData) {
  const supabase = await createClient()
  await verifyAnnouncementAccess(supabase, id)

  const title = formData.get('title') as string
  const body = formData.get('body') as string
  const categoryId = formData.get('category_id') as string | null
  const bannerUrl = formData.get('banner_url') as string | null
  const registrationLink = formData.get('registration_link') as string | null
  const expiresAt = formData.get('expires_at') as string | null
  const urgency = normalizeAnnouncementUrgency(formData.get('urgency'))
  const displayFont = normalizeAnnouncementDisplayFont(formData.get('display_font'))
  const displaySize = normalizeAnnouncementDisplaySize(formData.get('display_size'))

  const { error } = await supabase
    .from('announcements')
    .update({
      title: title || 'Untitled Announcement',
      body: body || '',
      category_id: categoryId || null,
      urgency,
      display_font: displayFont,
      display_size: displaySize,
      banner_url: bannerUrl || null,
      registration_link: registrationLink || null,
      expires_at: expiresAt || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/announcements')
  revalidatePath(`/dashboard/announcements/${id}/edit`)

  return { success: true }
}

export async function publishAnnouncement(id: string) {
  const supabase = await createClient()
  await verifyAnnouncementAccess(supabase, id)

  const now = new Date().toISOString()

  const { error } = await supabase
    .from('announcements')
    .update({
      status: 'published',
      published_at: now,
      updated_at: now,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/announcements')
  revalidatePath(`/dashboard/announcements/${id}/edit`)

  return { success: true }
}

export async function unpublishAnnouncement(id: string) {
  const supabase = await createClient()
  await verifyAnnouncementAccess(supabase, id)

  const { error } = await supabase
    .from('announcements')
    .update({
      status: 'draft',
      published_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/announcements')
  revalidatePath(`/dashboard/announcements/${id}/edit`)

  return { success: true }
}

export async function submitForReview(id: string) {
  const supabase = await createClient()
  await verifyAnnouncementAccess(supabase, id)

  const { error } = await supabase
    .from('announcements')
    .update({ status: 'submitted', updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/announcements')
  revalidatePath(`/dashboard/announcements/${id}/edit`)

  return { success: true }
}

export async function deleteAnnouncement(id: string) {
  const supabase = await createClient()
  await verifyAnnouncementAccess(supabase, id)

  const { error } = await supabase
    .from('announcements')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/announcements')
  redirect('/dashboard/announcements')
}
