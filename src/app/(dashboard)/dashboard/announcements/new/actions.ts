'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { logAuditEvent } from '@/lib/audit'
import { createClient } from '@/lib/supabase/server'
import { getWritableOrganizationId } from '@/lib/announcements/access'
import { readOptionalIsoDate } from '@/lib/announcements/form'
import {
  normalizeAnnouncementDisplayFont,
  normalizeAnnouncementDisplaySize,
  normalizeAnnouncementUrgency,
} from '@/lib/announcements/presentation'
import { getCurrentAccessContext } from '@/lib/auth/authz'
import { notifyAnnouncementSubmitted } from '@/lib/notifications'

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
  const expiresAt = readOptionalIsoDate(formData, 'expires_at')
  const scheduledPublishAt = readOptionalIsoDate(formData, 'scheduled_publish_at')
  const pinnedUntil = readOptionalIsoDate(formData, 'pinned_until')
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
      expires_at: expiresAt,
      scheduled_publish_at: scheduledPublishAt,
      pinned_until: pinnedUntil,
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  await logAuditEvent({
    actorId: access.userId,
    action: 'announcement.created_draft',
    targetType: 'announcement',
    targetId: announcement.id,
    metadata: {
      title,
      organization_id: organizationId,
      category_id: categoryId || null,
      urgency,
      expires_at: expiresAt,
      scheduled_publish_at: scheduledPublishAt,
      pinned_until: pinnedUntil,
    },
  })

  revalidatePath('/dashboard/announcements')
  redirect(`/dashboard/announcements/${announcement.id}/edit`)
}

export async function createAndSubmitAnnouncement(formData: FormData) {
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
  const expiresAt = readOptionalIsoDate(formData, 'expires_at')
  const scheduledPublishAt = readOptionalIsoDate(formData, 'scheduled_publish_at')
  const pinnedUntil = readOptionalIsoDate(formData, 'pinned_until')
  const urgency = normalizeAnnouncementUrgency(formData.get('urgency'))
  const displayFont = normalizeAnnouncementDisplayFont(formData.get('display_font'))
  const displaySize = normalizeAnnouncementDisplaySize(formData.get('display_size'))

  const { data: announcement, error } = await supabase
    .from('announcements')
    .insert({
      title,
      body,
      status: 'submitted',
      published_at: null,
      category_id: categoryId || null,
      organization_id: organizationId,
      author_id: access.userId,
      urgency,
      display_font: displayFont,
      display_size: displaySize,
      banner_url: bannerUrl || null,
      registration_link: registrationLink || null,
      expires_at: expiresAt,
      scheduled_publish_at: scheduledPublishAt,
      pinned_until: pinnedUntil,
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  await logAuditEvent({
    actorId: access.userId,
    action: 'announcement.created_submitted',
    targetType: 'announcement',
    targetId: announcement.id,
    metadata: {
      title,
      organization_id: organizationId,
      category_id: categoryId || null,
      urgency,
      expires_at: expiresAt,
      scheduled_publish_at: scheduledPublishAt,
      pinned_until: pinnedUntil,
    },
  })

  await notifyAnnouncementSubmitted({
    announcementId: announcement.id,
    title,
    organizationId,
    actorId: access.userId,
  })

  revalidatePath('/dashboard/announcements')
  redirect(`/dashboard/announcements/${announcement.id}/edit`)
}
