'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { logAuditEvent } from '@/lib/audit'
import { getWritableOrganizationId } from '@/lib/announcements/access'
import { readAnnouncementTextFields } from '@/lib/announcements/form'
import { readAnnouncementMutationFields } from '@/lib/announcements/mutations'
import {
  normalizeAnnouncementDisplayFont,
  normalizeAnnouncementDisplaySize,
  normalizeAnnouncementUrgency,
} from '@/lib/announcements/presentation'
import { getCurrentAccessContext } from '@/lib/auth/authz'
import { reportServerError } from '@/lib/error-reporting'
import { notifyAnnouncementSubmitted } from '@/lib/notifications'
import { checkActionRateLimit } from '@/lib/security/action-rate-limit'
import { createClient } from '@/lib/supabase/server'

const ANNOUNCEMENT_SAVE_ERROR = 'Could not save announcement. Try again.'
const ANNOUNCEMENT_SUBMIT_ERROR = 'Could not submit announcement. Try again.'

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

export async function createAnnouncement(formData: FormData) {
  const [supabase, access] = await Promise.all([createClient(), getCurrentAccessContext()])
  if (!access) throw new Error('Unauthorized')

  const organizationId = await getWritableOrganizationId(supabase, access)
  if (!organizationId) throw new Error('No organization')
  const rateLimit = await checkActionRateLimit('announcement-create', access.userId)
  if (rateLimit.limited) throw new Error('Too many attempts. Try again shortly.')

  const { title, body } = readAnnouncementTextFields(formData)
  const { categoryId, bannerUrl, registrationLink, expiresAt, scheduledPublishAt, pinnedUntil } =
    await readAnnouncementMutationFields(supabase, formData, {
      actorId: access.userId,
      organizationId,
    })
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

  if (error) {
    throwAnnouncementActionError(
      'dashboard.announcement.create_draft_failed',
      error,
      ANNOUNCEMENT_SAVE_ERROR,
      {
        actor_id: access.userId,
        organization_id: organizationId,
      }
    )
  }

  if (!announcement) {
    throwAnnouncementActionError(
      'dashboard.announcement.create_draft_missing_row',
      new Error('Announcement insert returned no row'),
      ANNOUNCEMENT_SAVE_ERROR,
      {
        actor_id: access.userId,
        organization_id: organizationId,
      }
    )
  }

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
  const [supabase, access] = await Promise.all([createClient(), getCurrentAccessContext()])
  if (!access) throw new Error('Unauthorized')

  const organizationId = await getWritableOrganizationId(supabase, access)
  if (!organizationId) throw new Error('No organization')
  const rateLimit = await checkActionRateLimit('announcement-submit-new', access.userId)
  if (rateLimit.limited) throw new Error('Too many attempts. Try again shortly.')

  const { title, body } = readAnnouncementTextFields(formData, { requireComplete: true })
  const { categoryId, bannerUrl, registrationLink, expiresAt, scheduledPublishAt, pinnedUntil } =
    await readAnnouncementMutationFields(supabase, formData, {
      actorId: access.userId,
      organizationId,
    })
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

  if (error) {
    throwAnnouncementActionError(
      'dashboard.announcement.create_submitted_failed',
      error,
      ANNOUNCEMENT_SUBMIT_ERROR,
      {
        actor_id: access.userId,
        organization_id: organizationId,
      }
    )
  }

  if (!announcement) {
    throwAnnouncementActionError(
      'dashboard.announcement.create_submitted_missing_row',
      new Error('Announcement insert returned no row'),
      ANNOUNCEMENT_SUBMIT_ERROR,
      {
        actor_id: access.userId,
        organization_id: organizationId,
      }
    )
  }

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
