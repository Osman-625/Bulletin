import Link from 'next/link'
import Image from 'next/image'
import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'
import {
  CARD_TITLE_SIZES,
  FEATURED_TITLE_SIZES,
  URGENCY_META,
  getAnnouncementTitleFontClass,
  isAnnouncementPinned,
  normalizeAnnouncementDisplayFont,
  normalizeAnnouncementDisplaySize,
  normalizeAnnouncementUrgency,
} from '@/lib/announcements/presentation'
import { announcementPath, toSafeHttpUrl } from '@/lib/announcements/urls'
import type { AnnouncementWithRelations } from '@/lib/types'

export type AnnouncementCardVisual = 'poster' | 'letterbox' | 'stamp' | 'ribbon'

function stripMarkdown(md: string): string {
  return md
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/\|/g, ' ')
    .replace(/\r?\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-MY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function isExpiringSoon(expiresAt: string | null): boolean {
  if (!expiresAt) return false
  const diff = new Date(expiresAt).getTime() - Date.now()
  return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000
}

function daysUntil(expiresAt: string | null): number | null {
  if (!expiresAt) return null
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return null
  return Math.ceil(diff / (24 * 60 * 60 * 1000))
}

function deadlineLabel(expiresAt: string | null) {
  const days = daysUntil(expiresAt)
  if (!expiresAt || days === null) return 'No deadline'
  if (days === 1) return '1 day left'
  if (days <= 14) return `${days} days left`
  return formatDate(expiresAt)
}

function categoryBadgeStyle(color: string): CSSProperties {
  return {
    color: 'var(--color-text-primary)',
    background: `color-mix(in oklab, ${color} 16%, var(--color-surface))`,
    borderColor: `color-mix(in oklab, ${color} 38%, var(--color-border))`,
  }
}

function categoryPanelStyle(color: string): CSSProperties {
  return {
    background: `color-mix(in oklab, ${color} 8%, var(--color-surface-elevated))`,
  }
}

function PosterImage({
  src,
  alt,
  sizes,
  preload = false,
  className,
}: {
  src: string
  alt: string
  sizes: string
  preload?: boolean
  className?: string
}) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      className={cn('object-contain', className)}
      sizes={sizes}
      preload={preload}
    />
  )
}

function EventMetaPill({
  label,
  value,
  active = false,
}: {
  label: string
  value: string
  active?: boolean
}) {
  return (
    <span
      className="announcement-meta-pill min-w-0 rounded-[0.75rem] border px-3 py-2"
      style={{
        background: active ? 'var(--color-accent-surface)' : 'var(--color-surface-elevated)',
        borderColor: active
          ? 'color-mix(in oklab, var(--color-accent-inti) 38%, var(--color-border))'
          : 'var(--color-border-subtle)',
      }}
    >
      <span className="block font-mono text-[0.62rem] font-bold tracking-[0.14em] text-[var(--color-text-muted)] uppercase">
        {label}
      </span>
      <span
        className="mt-1 block truncate text-[0.88rem] leading-tight font-bold"
        style={{ color: active ? 'var(--color-accent-inti)' : 'var(--color-text-primary)' }}
      >
        {value}
      </span>
    </span>
  )
}

// ── Standard card ──────────────────────────────────────────────────────────────
export default function AnnouncementCard({
  announcement,
  featured = false,
  visual = 'letterbox',
}: {
  announcement: AnnouncementWithRelations
  featured?: boolean
  visual?: AnnouncementCardVisual
}) {
  return featured ? (
    <FeaturedCard announcement={announcement} visual={visual} />
  ) : (
    <StandardCard announcement={announcement} visual={visual} />
  )
}

// ── Standard (2-col grid) ──────────────────────────────────────────────────────
function StandardCard({
  announcement,
  visual,
}: {
  announcement: AnnouncementWithRelations
  visual: AnnouncementCardVisual
}) {
  const {
    title,
    body,
    banner_url,
    published_at,
    expires_at,
    registration_link,
    categories,
    organizations,
  } = announcement

  const catColor = categories?.color ?? '#C8102E'
  const expiring = isExpiringSoon(expires_at)
  const urgency = normalizeAnnouncementUrgency(announcement.urgency)
  const displayFont = normalizeAnnouncementDisplayFont(announcement.display_font)
  const displaySize = normalizeAnnouncementDisplaySize(announcement.display_size)
  const urgencyMeta = URGENCY_META[urgency]
  const titleFontClass = getAnnouncementTitleFontClass(displayFont)
  const pinned = isAnnouncementPinned(announcement)
  const registrationHref = toSafeHttpUrl(registration_link)
  const deadlineIsActive = isExpiringSoon(expires_at)
  const hasBadgeRow =
    urgency !== 'normal' || pinned || Boolean(categories) || Boolean(registrationHref) || expiring

  return (
    <Link
      href={announcementPath(announcement)}
      data-testid="announcement-card"
      data-image-layout={visual}
      className="card-lift group relative flex h-full min-h-[13rem] flex-col overflow-hidden rounded-[1.25rem] outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      style={{
        background: 'var(--color-surface)',
        border: `1px solid var(--color-border)`,
        boxShadow: 'var(--shadow-soft)',
      }}
    >
      {/* Banner */}
      {banner_url && (
        <div
          data-card-media={visual}
          className={standardImagePanelClass(visual)}
          style={standardImagePanelStyle(catColor, visual)}
        >
          <PosterImage
            src={banner_url}
            alt={title}
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 31vw"
            className="transition-transform duration-500 ease-[var(--ease-ui)] group-hover:scale-[1.015]"
          />
        </div>
      )}

      <div className="announcement-card-body flex min-h-0 flex-1 flex-col p-4">
        {hasBadgeRow && (
          <div className="announcement-card-badges mb-3 flex flex-wrap items-center gap-2">
            {urgency !== 'normal' && <StatusChip label={urgencyMeta.label} tone="urgency" />}
            {pinned && <StatusChip label="Pinned" tone="published" />}
            {categories && <CategoryChip color={catColor} label={categories.name} />}
            {registrationHref && !expiring && <StatusChip label="Registration open" tone="open" />}
            {expiring && <StatusChip label={`Closes ${formatDate(expires_at!)}`} tone="closing" />}
          </div>
        )}

        <h2
          className={cn(
            titleFontClass,
            'announcement-card-title line-clamp-3 leading-[1.06] font-bold tracking-[-0.01em]'
          )}
          style={{ fontSize: CARD_TITLE_SIZES[displaySize], color: 'var(--color-text-primary)' }}
        >
          {title}
        </h2>

        <p
          className="announcement-card-summary announcement-card-summary-clamp announcement-card-summary-clamp-2 mt-2.5 text-sm leading-6 sm:text-[0.95rem]"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {body ? stripMarkdown(body) : ''}
        </p>

        <div className="announcement-card-meta mt-4 grid grid-cols-2 gap-2.5">
          <EventMetaPill
            label="Issued"
            value={published_at ? formatDate(published_at) : 'Pending'}
          />
          <EventMetaPill
            label="Deadline"
            value={deadlineLabel(expires_at)}
            active={deadlineIsActive}
          />
        </div>

        <div
          className="announcement-card-footer mt-auto flex items-center justify-between gap-3 border-t pt-3.5 text-sm"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <span
            className="min-w-0 truncate font-semibold"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {organizations?.name}
          </span>
          <span className="shrink-0 font-mono text-[0.66rem] font-bold tracking-[0.14em] text-[var(--color-text-muted)] uppercase transition-colors group-hover:text-[var(--color-accent)] group-hover:underline">
            Read details
          </span>
        </div>
      </div>
    </Link>
  )
}

function standardImagePanelClass(visual: AnnouncementCardVisual) {
  const base = 'relative overflow-hidden border-b'
  const border = 'border-[var(--color-border-subtle)]'

  if (visual === 'poster') {
    return cn(base, border, 'aspect-[5/6]')
  }

  if (visual === 'stamp') {
    return cn('relative mx-4 mt-4 aspect-[4/3] overflow-hidden rounded-[0.95rem] border', border)
  }

  if (visual === 'ribbon') {
    return cn(base, border, 'aspect-[21/9]')
  }

  return cn(base, border, 'aspect-[16/10]')
}

function standardImagePanelStyle(color: string, visual: AnnouncementCardVisual): CSSProperties {
  const surface =
    visual === 'stamp'
      ? `color-mix(in oklab, ${color} 12%, var(--color-surface-elevated))`
      : `color-mix(in oklab, ${color} 7%, var(--color-surface-elevated))`

  return { background: surface }
}

function StatusChip({
  label,
  tone,
}: {
  label: string
  tone: 'urgency' | 'published' | 'open' | 'closing'
}) {
  const styles: Record<typeof tone, CSSProperties> = {
    urgency: {
      color: 'var(--color-accent-hover)',
      background: 'var(--color-accent-surface)',
    },
    published: {
      color: 'var(--color-status-published-text)',
      background: 'var(--color-status-published-bg)',
    },
    open: {
      color: 'var(--color-accent-hover)',
      background: 'var(--color-accent-surface)',
    },
    closing: {
      color: 'var(--color-text-primary)',
      background: 'var(--color-deadline-surface)',
    },
  }

  return (
    <span
      className="announcement-card-chip rounded-md px-3 py-1.5 text-sm font-bold"
      style={styles[tone]}
    >
      {label}
    </span>
  )
}

function CategoryChip({ color, label }: { color: string; label: string }) {
  return (
    <span
      className="announcement-card-chip inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-bold"
      style={categoryBadgeStyle(color)}
    >
      <span
        className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
        style={{ background: color }}
        aria-hidden="true"
      />
      {label}
    </span>
  )
}

// ── Featured (full-width horizontal) ──────────────────────────────────────────
function FeaturedCard({
  announcement,
  visual,
}: {
  announcement: AnnouncementWithRelations
  visual: AnnouncementCardVisual
}) {
  const {
    title,
    body,
    banner_url,
    published_at,
    expires_at,
    registration_link,
    categories,
    organizations,
  } = announcement

  const catColor = categories?.color ?? '#C8102E'
  const expiring = isExpiringSoon(expires_at)
  const urgency = normalizeAnnouncementUrgency(announcement.urgency)
  const displayFont = normalizeAnnouncementDisplayFont(announcement.display_font)
  const displaySize = normalizeAnnouncementDisplaySize(announcement.display_size)
  const urgencyMeta = URGENCY_META[urgency]
  const titleFontClass = getAnnouncementTitleFontClass(displayFont)
  const pinned = isAnnouncementPinned(announcement)
  const registrationHref = toSafeHttpUrl(registration_link)
  const deadlineIsActive = isExpiringSoon(expires_at)
  const hasBadgeRow =
    urgency !== 'normal' || pinned || Boolean(categories) || Boolean(registrationHref) || expiring

  return (
    <Link
      href={announcementPath(announcement)}
      data-testid="announcement-card"
      data-image-layout={visual}
      className="featured-announcement-card card-lift group relative flex h-full min-h-[20rem] flex-col overflow-hidden rounded-[1.45rem] outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      style={{
        background: 'var(--color-surface)',
        border: `1px solid var(--color-border)`,
        boxShadow: 'var(--shadow-soft)',
      }}
    >
      {/* Visual panel */}
      <div
        data-card-media={visual}
        className={cn(
          'relative overflow-hidden border-b border-[var(--color-border-subtle)]',
          visual === 'ribbon' ? 'aspect-[21/9]' : 'aspect-[16/9] sm:aspect-[16/10]'
        )}
        style={categoryPanelStyle(catColor)}
      >
        {banner_url ? (
          <PosterImage
            src={banner_url}
            alt={title}
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 31vw"
            preload
            className="transition-transform duration-500 ease-[var(--ease-ui)] group-hover:scale-[1.015]"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span
              className="font-display text-7xl leading-none font-bold opacity-[0.18] select-none sm:text-8xl"
              style={{ color: catColor }}
            >
              {categories?.name?.[0] ?? organizations?.name?.[0] ?? 'B'}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="announcement-card-body flex min-h-0 flex-1 flex-col p-4 sm:p-5">
        {hasBadgeRow && (
          <div className="announcement-card-badges mb-4 flex flex-wrap items-center gap-2">
            {urgency !== 'normal' && <StatusChip label={urgencyMeta.label} tone="urgency" />}
            {pinned && <StatusChip label="Pinned" tone="published" />}
            {categories && <CategoryChip color={catColor} label={categories.name} />}
            {registrationHref && !expiring && <StatusChip label="Registration open" tone="open" />}
            {expiring && <StatusChip label={`Closes ${formatDate(expires_at!)}`} tone="closing" />}
          </div>
        )}

        <h2
          className={cn(
            titleFontClass,
            'announcement-card-title line-clamp-3 leading-[1.04] font-bold tracking-[-0.01em]'
          )}
          style={{
            fontSize: `min(${FEATURED_TITLE_SIZES[displaySize]}, 2.35rem)`,
            color: 'var(--color-text-primary)',
          }}
        >
          {title}
        </h2>

        <p
          className="announcement-card-summary announcement-card-summary-clamp announcement-card-summary-clamp-2 mt-3 text-base leading-7"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {body ? stripMarkdown(body) : ''}
        </p>

        <div className="announcement-card-meta mt-5 grid grid-cols-2 gap-2.5">
          <EventMetaPill
            label="Issued"
            value={published_at ? formatDate(published_at) : 'Pending'}
          />
          <EventMetaPill
            label="Deadline"
            value={deadlineLabel(expires_at)}
            active={deadlineIsActive}
          />
        </div>

        <div
          className="announcement-card-footer mt-auto flex items-center justify-between gap-3 border-t pt-4"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <span
            className="min-w-0 truncate text-sm font-medium"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {organizations?.name}
          </span>
          {published_at && (
            <span className="shrink-0 text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {formatDate(published_at)}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
