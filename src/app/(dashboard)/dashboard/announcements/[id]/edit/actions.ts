'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { logAuditEvent } from '@/lib/audit'
import { canManageAnnouncementForOrg } from '@/lib/announcements/access'
import {
  assertAnnouncementReadyForReview,
  readAnnouncementTextFields,
  readOptionalBannerUrl,
  readOptionalHttpUrl,
  readOptionalIsoDate,
} from '@/lib/announcements/form'
import {
  normalizeAnnouncementDisplayFont,
  normalizeAnnouncementDisplaySize,
  normalizeAnnouncementUrgency,
} from '@/lib/announcements/presentation'
import { canAccessAdminArea, getCurrentAccessContext } from '@/lib/auth/authz'
import { reportServerError } from '@/lib/error-reporting'
import { notifyAnnouncementSubmitted } from '@/lib/notifications'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const ANNOUNCEMENT_LOAD_ERROR = 'Could not load announcement. Try again.'
const ANNOUNCEMENT_SAVE_ERROR = 'Could not save announcement. Try again.'
const ANNOUNCEMENT_PUBLISH_ERROR = 'Could not publish announcement. Try again.'
const ANNOUNCEMENT_UNPUBLISH_ERROR = 'Could not unpublish announcement. Try again.'
const ANNOUNCEMENT_SUBMIT_ERROR = 'Could not submit announcement. Try again.'
const ANNOUNCEMENT_DELETE_ERROR = 'Could not delete announcement. Try again.'

type ErrorMetadata = Record<string, string | number | boolean | null | undefined>

function throwAnnouncementActionError(
  context: string,
  error: unknown,
  userMessage: string,
  metadata: ErrorMetadata = {}
): never {
  reportServerError(context, error, metadata)
  throw new Error(userMessage)
}

async function verifyAnnouncementAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  announcementId: string
) {
  const access = await getCurrentAccessContext()
  if (!access) throw new Error('Unauthorized')

  const { data: announcement, error: announcementReadError } = await supabase
    .from('announcements')
    .select('id, organization_id, title, body, author_id, status, scheduled_publish_at, banner_url')
    .eq('id', announcementId)
    .single()

  if (announcementReadError) {
    throwAnnouncementActionError(
      'dashboard.announcement.access_read_failed',
      announcementReadError,
      ANNOUNCEMENT_LOAD_ERROR,
      {
        actor_id: access.userId,
        announcement_id: announcementId,
      }
    )
  }

  if (!announcement) throw new Error('Announcement not found')
  if (!canManageAnnouncementForOrg(access, announcement.organization_id)) {
    throw new Error('Unauthorized: announcement belongs to a different organization')
  }

  return {
    actorId: access.userId,
    actorRole: access.role,
    organizationId: announcement.organization_id,
    title: announcement.title,
    body: announcement.body,
    authorId: announcement.author_id,
    status: announcement.status,
    scheduledPublishAt: announcement.scheduled_publish_at,
    bannerUrl: announcement.banner_url,
  }
}

function bannerStoragePath(publicUrl: string | null) {
  if (!publicUrl) return null
  try {
    const url = new URL(publicUrl)
    const marker = '/storage/v1/object/public/banner-images/'
    const markerIndex = url.pathname.indexOf(marker)
    if (markerIndex === -1) return null
    return decodeURIComponent(url.pathname.slice(markerIndex + marker.length))
  } catch {
    return null
  }
}

async function removePreviousBannerIfChanged(
  announcement: Awaited<ReturnType<typeof verifyAnnouncementAccess>>,
  nextBannerUrl: string | null,
  announcementId: string
) {
  const previousStoragePath = bannerStoragePath(announcement.bannerUrl)
  const nextStoragePath = bannerStoragePath(nextBannerUrl)
  if (!previousStoragePath || previousStoragePath === nextStoragePath) return

  const { error: bannerRemoveError } = await createAdminClient()
    .storage.from('banner-images')
    .remove([previousStoragePath])

  if (bannerRemoveError) {
    reportServerError('dashboard.announcement.banner_replace_cleanup_failed', bannerRemoveError, {
      actor_id: announcement.actorId,
      announcement_id: announcementId,
      organization_id: announcement.organizationId,
    })
  }
}

export async function updateAnnouncement(id: string, formData: FormData) {
  const supabase = await createClient()
  const announcement = await verifyAnnouncementAccess(supabase, id)

  const { title, body } = readAnnouncementTextFields(formData)
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
      title,
      body,
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

  if (error) {
    throwAnnouncementActionError(
      'dashboard.announcement.update_failed',
      error,
      ANNOUNCEMENT_SAVE_ERROR,
      {
        actor_id: announcement.actorId,
        announcement_id: id,
        organization_id: announcement.organizationId,
      }
    )
  }

  await removePreviousBannerIfChanged(announcement, bannerUrl || null, id)

  await logAuditEvent({
    actorId: announcement.actorId,
    action: 'announcement.updated',
    targetType: 'announcement',
    targetId: id,
    metadata: {
      title,
      previous_status: announcement.status,
      organization_id: announcement.organizationId,
      category_id: categoryId || null,
      urgency,
      expires_at: expiresAt,
      scheduled_publish_at: scheduledPublishAt,
      pinned_until: pinnedUntil,
    },
  })

  revalidatePath('/dashboard/announcements')
  revalidatePath(`/dashboard/announcements/${id}/edit`)

  return { success: true }
}

export async function publishAnnouncement(id: string) {
  const supabase = await createClient()
  const announcement = await verifyAnnouncementAccess(supabase, id)
  if (!canAccessAdminArea(announcement.actorRole)) {
    throw new Error('Unauthorized')
  }

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

  if (error) {
    throwAnnouncementActionError(
      'dashboard.announcement.publish_failed',
      error,
      ANNOUNCEMENT_PUBLISH_ERROR,
      {
        actor_id: announcement.actorId,
        announcement_id: id,
        organization_id: announcement.organizationId,
      }
    )
  }

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

  if (error) {
    throwAnnouncementActionError(
      'dashboard.announcement.unpublish_failed',
      error,
      ANNOUNCEMENT_UNPUBLISH_ERROR,
      {
        actor_id: announcement.actorId,
        announcement_id: id,
        organization_id: announcement.organizationId,
      }
    )
  }

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
  assertAnnouncementReadyForReview(announcement.title, announcement.body)

  const { error } = await supabase
    .from('announcements')
    .update({
      status: 'submitted',
      rejection_comment: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    throwAnnouncementActionError(
      'dashboard.announcement.submit_failed',
      error,
      ANNOUNCEMENT_SUBMIT_ERROR,
      {
        actor_id: announcement.actorId,
        announcement_id: id,
        organization_id: announcement.organizationId,
      }
    )
  }

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

  if (error) {
    throwAnnouncementActionError(
      'dashboard.announcement.delete_failed',
      error,
      ANNOUNCEMENT_DELETE_ERROR,
      {
        actor_id: announcement.actorId,
        announcement_id: id,
        organization_id: announcement.organizationId,
      }
    )
  }

  const storagePath = bannerStoragePath(announcement.bannerUrl)
  if (storagePath) {
    const { error: bannerRemoveError } = await createAdminClient()
      .storage.from('banner-images')
      .remove([storagePath])

    if (bannerRemoveError) {
      reportServerError('dashboard.announcement.banner_delete_failed', bannerRemoveError, {
        actor_id: announcement.actorId,
        announcement_id: id,
        organization_id: announcement.organizationId,
      })
    }
  }

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
