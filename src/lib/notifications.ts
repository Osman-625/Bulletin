import { cache } from 'react'
import { createClient, createServiceClient } from './supabase/server'
import { getCurrentAccessContext } from './auth/authz'
import { reportServerError } from '@/lib/error-reporting'
import type { Database } from './database.types'
import type { DbNotification } from './types'

type NotificationInsert = Database['public']['Tables']['notifications']['Insert']

type SubmittedNotificationInput = {
  announcementId: string
  title: string
  organizationId: string
  actorId: string
}

type ReviewedNotificationInput = {
  announcementId: string
  title: string
  authorId: string
  reviewerId: string
  approved: boolean
  scheduledPublishAt?: string | null
  comment?: string | null
}

function compactUnique(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))]
}

function trimBody(value: string) {
  return value.length > 220 ? `${value.slice(0, 217)}...` : value
}

export const getUnreadNotificationCount = cache(
  async function getUnreadNotificationCount(): Promise<number> {
    const access = await getCurrentAccessContext()
    if (!access) return 0

    const supabase = await createClient()
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', access.userId)
      .is('read_at', null)

    if (error) {
      reportServerError('notifications.unread_count.query_failed', error, {
        userId: access.userId,
      })
      return 0
    }

    return count ?? 0
  }
)

export async function getNotificationsForCurrentUser(): Promise<DbNotification[]> {
  const access = await getCurrentAccessContext()
  if (!access) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('recipient_id', access.userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    reportServerError('notifications.current_user.query_failed', error, {
      userId: access.userId,
    })
    return []
  }

  return data ?? []
}

export async function createNotificationsForUsers(
  recipientIds: string[],
  notification: Omit<NotificationInsert, 'recipient_id'>
) {
  const recipients = compactUnique(recipientIds)
  if (recipients.length === 0) return

  const supabase = await createServiceClient()
  const rows: NotificationInsert[] = recipients.map((recipientId) => ({
    ...notification,
    recipient_id: recipientId,
  }))

  const { error } = await supabase.from('notifications').insert(rows)
  if (error) {
    reportServerError('notifications.create_for_users.insert_failed', error, {
      recipientCount: recipients.length,
      type: notification.type,
    })
  }
}

export async function notifyAnnouncementSubmitted({
  announcementId,
  title,
  organizationId,
  actorId,
}: SubmittedNotificationInput) {
  const supabase = await createServiceClient()
  const [{ data: orgAdmins }, { data: platformAdmins }] = await Promise.all([
    supabase
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', organizationId)
      .eq('member_role', 'admin'),
    supabase.from('users').select('id').in('role', ['owner', 'super_admin']),
  ])

  const recipients = compactUnique([
    ...(orgAdmins ?? []).map((member) => member.user_id),
    ...(platformAdmins ?? []).map((user) => user.id),
  ]).filter((recipientId) => recipientId !== actorId)

  await createNotificationsForUsers(recipients, {
    actor_id: actorId,
    announcement_id: announcementId,
    type: 'announcement_submitted',
    title: 'Announcement ready for review',
    body: `"${trimBody(title)}" was submitted for approval.`,
    href: `/admin/review/${announcementId}`,
  })
}

export async function notifyAnnouncementReviewed({
  announcementId,
  title,
  authorId,
  reviewerId,
  approved,
  scheduledPublishAt,
  comment,
}: ReviewedNotificationInput) {
  const scheduledTime = scheduledPublishAt ? new Date(scheduledPublishAt) : null
  const approvedBody =
    scheduledTime && scheduledTime.getTime() > Date.now()
      ? `approved and scheduled for ${scheduledTime.toLocaleString('en-MY', {
          dateStyle: 'medium',
          timeStyle: 'short',
        })}.`
      : 'approved and published.'

  await createNotificationsForUsers([authorId], {
    actor_id: reviewerId,
    announcement_id: announcementId,
    type: approved ? 'announcement_approved' : 'announcement_rejected',
    title: approved ? 'Announcement approved' : 'Announcement needs changes',
    body: approved
      ? `"${trimBody(title)}" was ${approvedBody}`
      : trimBody(comment ? `"${title}" was rejected: ${comment}` : `"${title}" was rejected.`),
    href: `/dashboard/announcements/${announcementId}/edit`,
  })
}
