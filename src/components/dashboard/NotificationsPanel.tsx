import Link from 'next/link'
import { Bell, CheckCheck, ExternalLink } from 'lucide-react'
import { GlassCard } from './GlassCard'
import { getNotificationsForCurrentUser } from '@/lib/notifications'
import { markAllNotificationsRead, markNotificationRead } from '@/lib/notification-actions'
import type { DbNotification } from '@/lib/types'

function formatNotificationTime(iso: string) {
  return new Date(iso).toLocaleString('en-MY', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function notificationTone(type: DbNotification['type']) {
  if (type === 'password_reset_requested') {
    return {
      label: 'Password reset',
      color: 'var(--color-status-submitted-text)',
      background: 'var(--color-status-submitted-bg)',
    }
  }

  if (type === 'announcement_rejected') {
    return {
      label: 'Changes requested',
      color: 'var(--color-status-rejected-text)',
      background: 'var(--color-status-rejected-bg)',
    }
  }

  if (type === 'announcement_approved') {
    return {
      label: 'Approved',
      color: 'var(--color-status-published-text)',
      background: 'var(--color-status-published-bg)',
    }
  }

  return {
    label: 'Review',
    color: 'var(--color-accent-inti)',
    background: 'var(--color-accent-surface)',
  }
}

export async function NotificationsPanel() {
  const notifications = await getNotificationsForCurrentUser()
  const unreadCount = notifications.filter((notification) => !notification.read_at).length

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Stay updated on approvals and submission activity.
          </p>
        </div>

        {unreadCount > 0 && (
          <form action={markAllNotificationsRead}>
            <button
              type="submit"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--color-border)] px-4 text-sm font-semibold text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
            >
              <CheckCheck size={16} aria-hidden="true" />
              Mark all read
            </button>
          </form>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex min-h-[22rem] flex-col items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-6 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-accent-surface)] text-[var(--color-accent-inti)]">
            <Bell size={20} aria-hidden="true" />
          </div>
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">All quiet</h2>
          <p className="mt-1 max-w-sm text-sm text-[var(--color-text-muted)]">
            Review decisions and submission alerts will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const tone = notificationTone(notification.type)
            const isUnread = !notification.read_at

            return (
              <GlassCard key={notification.id} hover={false} className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="flex min-w-0 flex-1 gap-3">
                    <span
                      className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full"
                      style={{ background: isUnread ? tone.color : 'var(--color-border)' }}
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span
                          className="rounded-md px-2.5 py-1 text-xs font-semibold"
                          style={{ color: tone.color, background: tone.background }}
                        >
                          {tone.label}
                        </span>
                        <span className="font-mono text-xs text-[var(--color-text-muted)]">
                          {formatNotificationTime(notification.created_at)}
                        </span>
                      </div>
                      <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                        {notification.title}
                      </h2>
                      {notification.body && (
                        <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">
                          {notification.body}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                    {notification.href && (
                      <Link
                        href={notification.href}
                        className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-[var(--color-accent-inti)] px-3 text-sm font-semibold text-white transition-transform active:scale-[0.98]"
                      >
                        Open
                        <ExternalLink size={14} aria-hidden="true" />
                      </Link>
                    )}
                    {isUnread && (
                      <form action={markNotificationRead.bind(null, notification.id)}>
                        <button
                          type="submit"
                          className="inline-flex min-h-11 items-center rounded-lg border border-[var(--color-border)] px-3 text-sm font-semibold text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
                        >
                          Mark read
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </GlassCard>
            )
          })}
        </div>
      )}
    </div>
  )
}
