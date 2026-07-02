'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { logAuditEvent } from '@/modules/audit'
import { canAccessAdminArea, getCurrentAccessContext } from '@/modules/auth/authz'
import { reportServerError } from '@/shared/errors/error-reporting'
import { notifyAnnouncementReviewed } from '@/modules/notifications'
import { checkActionRateLimit } from '@/shared/middleware/action-rate-limit'
import { createClient } from '@/infrastructure/database/server'

const REVIEW_WRITE_ERROR = 'review_failed'

function redirectWithReviewError(announcementId: string): never {
  redirect(`/admin/review/${announcementId}?error=${REVIEW_WRITE_ERROR}`)
}

export async function reviewAnnouncement(announcementId: string, formData: FormData) {
  const access = await getCurrentAccessContext()
  if (!access) redirect('/login')
  if (!canAccessAdminArea(access.role)) redirect('/login')
  const rateLimit = await checkActionRateLimit(
    'announcement-review',
    `${access.userId}:${announcementId}`
  )
  if (rateLimit.limited) redirectWithReviewError(announcementId)

  const action = formData.get('_action')
  const comment = (formData.get('comment') as string | null)?.trim() || null
  if (action !== 'approve' && action !== 'reject') redirect('/admin/review')
  const supabase = await createClient()
  const { data: announcement, error: announcementReadError } = await supabase
    .from('announcements')
    .select('organization_id, status, author_id, title, scheduled_publish_at')
    .eq('id', announcementId)
    .single()

  if (announcementReadError) {
    reportServerError('admin.review.announcement_read_failed', announcementReadError, {
      actor_id: access.userId,
      announcement_id: announcementId,
    })
    redirectWithReviewError(announcementId)
  }
  if (!announcement || announcement.status !== 'submitted') redirect('/admin/review')
  if (access.role === 'admin' && !access.orgIds.includes(announcement.organization_id)) {
    redirect('/admin/review')
  }
  if (action === 'reject' && !comment) {
    redirect(`/admin/review/${announcementId}?error=rejection_comment_required`)
  }

  if (action === 'approve') {
    const now = new Date().toISOString()
    const scheduledPublishAt =
      announcement.scheduled_publish_at &&
      new Date(announcement.scheduled_publish_at).getTime() > Date.now()
        ? announcement.scheduled_publish_at
        : null

    const { error } = await supabase
      .from('announcements')
      .update({
        status: 'published',
        published_at: scheduledPublishAt ?? now,
        scheduled_publish_at: scheduledPublishAt,
        rejection_comment: null,
      })
      .eq('id', announcementId)
    if (error) {
      reportServerError('admin.review.approve_failed', error, {
        actor_id: access.userId,
        announcement_id: announcementId,
      })
      redirectWithReviewError(announcementId)
    }
  } else {
    const { error } = await supabase
      .from('announcements')
      .update({
        status: 'rejected',
        rejection_comment: comment,
      })
      .eq('id', announcementId)
    if (error) {
      reportServerError('admin.review.reject_failed', error, {
        actor_id: access.userId,
        announcement_id: announcementId,
      })
      redirectWithReviewError(announcementId)
    }
  }

  const { error: reviewError } = await supabase.from('announcement_reviews').insert({
    announcement_id: announcementId,
    reviewer_id: access.userId,
    action: action === 'approve' ? 'approved' : 'rejected',
    comment,
  })
  if (reviewError) {
    reportServerError('admin.review.record_insert_failed', reviewError, {
      actor_id: access.userId,
      announcement_id: announcementId,
    })
  }

  await notifyAnnouncementReviewed({
    announcementId,
    title: announcement.title,
    authorId: announcement.author_id,
    reviewerId: access.userId,
    approved: action === 'approve',
    scheduledPublishAt: announcement.scheduled_publish_at,
    comment,
  })

  await logAuditEvent({
    actorId: access.userId,
    action: action === 'approve' ? 'review.approved' : 'review.rejected',
    targetType: 'announcement',
    targetId: announcementId,
    metadata: {
      title: announcement.title,
      author_id: announcement.author_id,
      organization_id: announcement.organization_id,
      scheduled_publish_at: announcement.scheduled_publish_at,
      comment,
    },
  })

  revalidatePath('/admin/review')
  revalidatePath('/admin')
  redirect('/admin/review')
}
