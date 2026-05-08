'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { logAuditEvent } from '@/lib/audit'
import { createClient } from '@/lib/supabase/server'
import { canAccessAdminArea, getCurrentAccessContext } from '@/lib/auth/authz'
import { notifyAnnouncementReviewed } from '@/lib/notifications'

export async function reviewAnnouncement(announcementId: string, formData: FormData) {
  const access = await getCurrentAccessContext()
  if (!access) redirect('/login')
  if (!canAccessAdminArea(access.role)) redirect('/login')

  const action = formData.get('_action') as 'approve' | 'reject'
  const comment = (formData.get('comment') as string | null)?.trim() || null
  const supabase = await createClient()
  const { data: announcement } = await supabase
    .from('announcements')
    .select('organization_id, status, author_id, title, scheduled_publish_at')
    .eq('id', announcementId)
    .single()

  if (!announcement || announcement.status !== 'submitted') redirect('/admin/review')
  if (access.role === 'admin' && !access.orgIds.includes(announcement.organization_id)) {
    redirect('/admin/review')
  }

  if (action === 'approve') {
    const now = new Date().toISOString()
    const scheduledPublishAt =
      announcement.scheduled_publish_at &&
      new Date(announcement.scheduled_publish_at).getTime() > Date.now()
        ? announcement.scheduled_publish_at
        : null

    const { error } = await supabase.from('announcements').update({
      status: 'published',
      published_at: scheduledPublishAt ?? now,
      scheduled_publish_at: scheduledPublishAt,
      rejection_comment: null,
    }).eq('id', announcementId)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase.from('announcements').update({
      status: 'rejected',
      rejection_comment: comment ?? 'No reason provided.',
    }).eq('id', announcementId)
    if (error) throw new Error(error.message)
  }

  const { error: reviewError } = await supabase.from('announcement_reviews').insert({
    announcement_id: announcementId,
    reviewer_id: access.userId,
    action: action === 'approve' ? 'approved' : 'rejected',
    comment,
  })
  if (reviewError) throw new Error(reviewError.message)

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
