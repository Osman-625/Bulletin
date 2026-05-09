'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Clock, Edit2, Eye, MoreVertical, FileImage, Pin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GlassCard } from './GlassCard'
import { StatusBadge } from './StatusBadge'
import type { PostStatus } from '@/lib/types'
import {
  URGENCY_META,
  normalizeAnnouncementUrgency,
  type AnnouncementUrgency,
} from '@/lib/announcements/presentation'

export type AnnouncementRowData = {
  id: string
  title: string
  status: PostStatus
  urgency: AnnouncementUrgency
  banner_url: string | null
  published_at: string | null
  scheduled_publish_at: string | null
  pinned_until: string | null
  rejection_comment: string | null
  view_count: number
  updated_at: string
  categories: { id: string; name: string; color: string | null } | null
  organizations: { id: string; name: string } | null
  author: { display_name: string } | null
}

interface AnnouncementRowProps {
  announcement: AnnouncementRowData
  style?: React.CSSProperties
}

export function AnnouncementRow({ announcement, style }: AnnouncementRowProps) {
  const router = useRouter()
  const isDraft = announcement.status === 'draft'
  const urgency = normalizeAnnouncementUrgency(announcement.urgency)
  const urgencyMeta = URGENCY_META[urgency]
  const nowMs = new Date().getTime()
  const scheduledDate = announcement.scheduled_publish_at
    ? new Date(announcement.scheduled_publish_at)
    : null
  const pinnedUntil = announcement.pinned_until ? new Date(announcement.pinned_until) : null
  const isScheduled =
    announcement.status === 'published' &&
    scheduledDate !== null &&
    !Number.isNaN(scheduledDate.getTime()) &&
    scheduledDate.getTime() > nowMs
  const isPinned =
    pinnedUntil !== null && !Number.isNaN(pinnedUntil.getTime()) && pinnedUntil.getTime() > nowMs

  function handleRowClick(e: React.MouseEvent) {
    // Prevent navigation if clicking action buttons
    const target = e.target as HTMLElement
    if (target.closest('[data-action]')) return
    router.push(`/dashboard/announcements/${announcement.id}/edit`)
  }

  function handleEditClick(e: React.MouseEvent) {
    e.stopPropagation()
    router.push(`/dashboard/announcements/${announcement.id}/edit`)
  }

  const dateSource =
    isScheduled && announcement.scheduled_publish_at
      ? announcement.scheduled_publish_at
      : (announcement.published_at ?? announcement.updated_at)
  const dateLabel = new Date(dateSource).toLocaleDateString('en-MY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <div style={style}>
      <GlassCard hover className={cn('cursor-pointer', isDraft && 'border-dashed opacity-70')}>
        <div
          className="flex items-center gap-5 p-5"
          onClick={handleRowClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              router.push(`/dashboard/announcements/${announcement.id}/edit`)
            }
          }}
        >
          {/* Thumbnail */}
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--color-glass-border)] bg-[var(--color-surface-elevated)]">
            {announcement.banner_url ? (
              <Image
                src={announcement.banner_url}
                alt={announcement.title}
                width={64}
                height={64}
                className="h-full w-full object-contain"
              />
            ) : (
              <FileImage size={20} className="text-[var(--color-text-muted)]" />
            )}
          </div>

          {/* Middle — title + meta */}
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              {(() => {
                return (
                  <StatusBadge
                    status={
                      announcement.status as
                        | 'draft'
                        | 'submitted'
                        | 'published'
                        | 'rejected'
                        | 'expired'
                        | 'archived'
                    }
                  />
                )
              })()}
              {urgency !== 'normal' && (
                <span
                  className="rounded px-2 py-0.5 text-[15px] font-bold tracking-wider uppercase"
                  style={{ color: urgencyMeta.tone, background: urgencyMeta.background }}
                >
                  {urgencyMeta.label}
                </span>
              )}
              {isScheduled && (
                <span className="inline-flex items-center gap-1 rounded bg-[var(--color-accent-surface)] px-2 py-0.5 text-[15px] font-bold tracking-wider text-[var(--color-accent-inti)] uppercase">
                  <Clock size={12} aria-hidden="true" />
                  Scheduled
                </span>
              )}
              {isPinned && (
                <span className="inline-flex items-center gap-1 rounded bg-[var(--color-status-published-bg)] px-2 py-0.5 text-[15px] font-bold tracking-wider text-[var(--color-status-published-text)] uppercase">
                  <Pin size={12} aria-hidden="true" />
                  Pinned
                </span>
              )}
              <span className="truncate text-lg leading-tight font-semibold text-[var(--color-text-primary)]">
                {announcement.title}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
              {announcement.categories ? (
                <>
                  <span
                    className="inline-block h-2 w-2 shrink-0 rounded-full"
                    style={{
                      backgroundColor: announcement.categories.color ?? 'var(--color-accent)',
                    }}
                  />
                  <span>{announcement.categories.name}</span>
                  {announcement.organizations && (
                    <>
                      <span className="text-[var(--color-text-muted)]">·</span>
                      <span className="text-[var(--color-text-muted)]">
                        {announcement.organizations.name}
                      </span>
                    </>
                  )}
                </>
              ) : (
                <>
                  <span className="text-[var(--color-text-muted)]">Uncategorized</span>
                  {announcement.organizations && (
                    <>
                      <span className="text-[var(--color-text-muted)]">·</span>
                      <span className="text-[var(--color-text-muted)]">
                        {announcement.organizations.name}
                      </span>
                    </>
                  )}
                </>
              )}
            </div>
            {announcement.status === 'rejected' && announcement.rejection_comment && (
              <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--color-status-rejected-text)]">
                Admin note: {announcement.rejection_comment}
              </p>
            )}
          </div>

          {/* Right — date + author */}
          <div className="shrink-0 text-right">
            <p className="font-mono text-sm text-[var(--color-text-muted)]">{dateLabel}</p>
            <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
              {isScheduled
                ? 'Scheduled'
                : isDraft
                  ? 'Draft'
                  : announcement.author
                    ? `Published by ${announcement.author.display_name}`
                    : 'Published'}
            </p>
            <p className="mt-1 inline-flex items-center justify-end gap-1 text-xs text-[var(--color-text-muted)]">
              <Eye size={12} aria-hidden="true" />
              {announcement.view_count.toLocaleString('en-MY')}
            </p>
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-1" data-action="true">
            <button
              type="button"
              data-action="true"
              onClick={handleEditClick}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-accent-surface)] hover:text-[var(--color-accent)]"
              aria-label="Edit announcement"
            >
              <Edit2 size={16} />
            </button>
            <button
              type="button"
              data-action="true"
              onClick={(e) => e.stopPropagation()}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)]"
              aria-label="More options"
            >
              <MoreVertical size={16} />
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
