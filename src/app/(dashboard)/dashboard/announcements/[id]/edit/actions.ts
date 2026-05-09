'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { logAuditEvent } from '@/lib/audit'
import { createClient } from '@/lib/supabase/server'
import { canManageAnnouncementForOrg } from '@/lib/announcements/access'
import {
  readOptionalBannerUrl,
  readOptionalHttpUrl,
  readOptionalIsoDate,
} from '@/lib/announcements/form'
import {
  normalizeAnnouncementDisplayFont,
  normalizeAnnouncementDisplaySize,
  normalizeAnnouncementUrgency,
} from '@/lib/announcements/presentation'
import { getCurrentAccessContext } from '@/lib/auth/authz'
import { notifyAnnouncementSubmitted } from '@/lib/notifications'

async function verifyAnnouncementAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  announcementId: string
) {
  const access = await getCurrentAccessContext()
  if (!access) throw new Error('Unauthorized')

  const { data: announcement } = await supabase
    .from('announcements')
    .select('id, organization_id, title, author_id, status, scheduled_publish_at')
    .eq('id', announcementId)
    .single()

  if (!announcement) throw new Error('Announcement not found')
  if (!canManageAnnouncementForOrg(access, announcement.organization_id)) {
    throw new Error('Unauthorized: announcement belongs to a different organization')
  }

  return {
    actorId: access.userId,
    actorRole: access.role,
    organizationId: announcement.organization_id,
    title: announcement.title,
    authorId: announcement.author_id,
    status: announcement.status,
    scheduledPublishAt: announcement.scheduled_publish_at,
  }
}

export async function updateAnnouncement(id: string, formData: FormData) {
  const supabase = await createClient()
  await verifyAnnouncementAccess(supabase, id)

  const title = formData.get('title') as string
  const body = formData.get('body') as string
  const categoryId = formData.get('category_id') as string | null
  const bannerUrl = readOptionalBannerUrl(formData, 'banner_url')
  const registrationLink = readOptionalHttpUrl(formData, 'registration_link', 'Registration link')
  const expiresAt = readOptionalIsoDate(formData, 'expires_at')
  const scheduledPublishAt = readOptionalIsoDate(formData, 'scheduled_publish_at')
  const pinnedUntil = readOptionalIsoDate(formData, 'pinned_until')
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
      expires_at: expiresAt,
      scheduled_publish_at: scheduledPublishAt,
      pinned_until: pinnedUntil,
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
  const announcement = await verifyAnnouncementAccess(supabase, id)

  const now = new Date().toISOString()
  const scheduledPublishAt =
    announcement.scheduledPublishAt &&
    new Date(announcement.scheduledPublishAt).getTime() > Date.now()
      ? announcement.scheduledPublishAt
      : null

  const { error } = await supabase
    .from('announcements')
    .update({
      status: 'published',
      published_at: scheduledPublishAt ?? now,
      scheduled_publish_at: scheduledPublishAt,
      rejection_comment: null,
      updated_at: now,
    })
    .eq('id', id)

  if (error) throw new Error(error.message)

  await logAuditEvent({
    actorId: announcement.actorId,
    action: scheduledPublishAt ? 'announcement.scheduled' : 'announcement.published',
    targetType: 'announcement',
    targetId: id,
    metadata: {
      title: announcement.title,
      previous_status: announcement.status,
      organization_id: announcement.organizationId,
      published_at: scheduledPublishAt ?? now,
      scheduled_publish_at: scheduledPublishAt,
    },
  })

  revalidatePath('/dashboard/announcements')
  revalidatePath(`/dashboard/announcements/${id}/edit`)

  return { success: true }
}

export async function unpublishAnnouncement(id: string) {
  const supabase = await createClient()
  const announcement = await verifyAnnouncementAccess(supabase, id)

  const { error } = await supabase
    .from('announcements')
    .update({
      status: 'draft',
      published_at: null,
      scheduled_publish_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) throw new Error(error.message)

  await logAuditEvent({
    actorId: announcement.actorId,
    action: 'announcement.unpublished',
    targetType: 'announcement',
    targetId: id,
    metadata: {
      title: announcement.title,
      previous_status: announcement.status,
      organization_id: announcement.organizationId,
    },
  })

  revalidatePath('/dashboard/announcements')
  revalidatePath(`/dashboard/announcements/${id}/edit`)

  return { success: true }
}

export async function submitForReview(id: string) {
  const supabase = await createClient()
  const announcement = await verifyAnnouncementAccess(supabase, id)

  const { error } = await supabase
    .from('announcements')
    .update({
      status: 'submitted',
      rejection_comment: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) throw new Error(error.message)

  await logAuditEvent({
    actorId: announcement.actorId,
    action: 'announcement.submitted',
    targetType: 'announcement',
    targetId: id,
    metadata: {
      title: announcement.title,
      previous_status: announcement.status,
      organization_id: announcement.organizationId,
    },
  })

  revalidatePath('/dashboard/announcements')
  revalidatePath(`/dashboard/announcements/${id}/edit`)

  const access = await getCurrentAccessContext()
  if (access && announcement.status !== 'submitted') {
    await notifyAnnouncementSubmitted({
      announcementId: id,
      title: announcement.title,
      organizationId: announcement.organizationId,
      actorId: access.userId,
    })
  }

  return { success: true }
}

export async function deleteAnnouncement(id: string) {
  const supabase = await createClient()
  const announcement = await verifyAnnouncementAccess(supabase, id)

  const { error } = await supabase.from('announcements').delete().eq('id', id)

  if (error) throw new Error(error.message)

  await logAuditEvent({
    actorId: announcement.actorId,
    action: 'announcement.deleted',
    targetType: 'announcement',
    targetId: id,
    metadata: {
      title: announcement.title,
      previous_status: announcement.status,
      organization_id: announcement.organizationId,
    },
  })

  revalidatePath('/dashboard/announcements')
  redirect('/dashboard/announcements')
}
