'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Edit2, MoreVertical, FileImage } from 'lucide-react'
import { cn } from '@/lib/utils'
import { GlassCard } from './GlassCard'
import { StatusBadge } from './StatusBadge'
import type { PostStatus } from '@/lib/types'

export type AnnouncementRowData = {
  id: string
  title: string
  status: PostStatus
  banner_url: string | null
  published_at: string | null
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

  const dateLabel = announcement.published_at
    ? new Date(announcement.published_at).toLocaleDateString('en-MY', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : new Date(announcement.updated_at).toLocaleDateString('en-MY', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })

  return (
    <div style={style}>
    <GlassCard
      hover
      className={cn(
        'cursor-pointer',
        isDraft && 'opacity-70 border-dashed'
      )}
    >
      <div
        className="flex items-center gap-5 p-5"
        onClick={handleRowClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && router.push(`/dashboard/announcements/${announcement.id}/edit`)}
      >
        {/* Thumbnail */}
        <div className="w-16 h-16 rounded-xl overflow-hidden border border-[var(--color-glass-border)] shrink-0 bg-[var(--color-surface-elevated)] flex items-center justify-center">
          {announcement.banner_url ? (
            <Image
              src={announcement.banner_url}
              alt={announcement.title}
              width={64}
              height={64}
              className="w-full h-full object-cover"
            />
          ) : (
            <FileImage
              size={20}
              className="text-[var(--color-text-muted)]"
            />
          )}
        </div>

        {/* Middle — title + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <StatusBadge status={announcement.status === 'expired' ? 'archived' : announcement.status as 'draft' | 'published' | 'archived'} />
            <span className="text-lg font-semibold text-[var(--color-text-primary)] truncate leading-tight">
              {announcement.title}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
            {announcement.categories ? (
              <>
                <span
                  className="inline-block w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: announcement.categories.color ?? 'var(--color-accent)' }}
                />
                <span>{announcement.categories.name}</span>
                {announcement.organizations && (
                  <>
                    <span className="text-[var(--color-text-muted)]">·</span>
                    <span className="text-[var(--color-text-muted)]">{announcement.organizations.name}</span>
                  </>
                )}
              </>
            ) : (
              <>
                <span className="text-[var(--color-text-muted)]">Uncategorized</span>
                {announcement.organizations && (
                  <>
                    <span className="text-[var(--color-text-muted)]">·</span>
                    <span className="text-[var(--color-text-muted)]">{announcement.organizations.name}</span>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right — date + author */}
        <div className="text-right shrink-0">
          <p className="text-sm font-mono text-[var(--color-text-muted)]">{dateLabel}</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            {isDraft
              ? 'Draft'
              : announcement.author
              ? `Published by ${announcement.author.display_name}`
              : 'Published'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0" data-action="true">
          <button
            data-action="true"
            onClick={handleEditClick}
            className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-surface)] transition-colors"
            aria-label="Edit announcement"
          >
            <Edit2 size={16} />
          </button>
          <button
            data-action="true"
            onClick={(e) => e.stopPropagation()}
            className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-elevated)] transition-colors"
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
