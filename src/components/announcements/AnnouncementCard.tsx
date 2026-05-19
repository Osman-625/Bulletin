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

// ── Standard card ──────────────────────────────────────────────────────────────
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
  const urgency = normalizeAnnouncementUrgency(announcement.urgency)
  const displayFont = normalizeAnnouncementDisplayFont(announcement.display_font)
  const displaySize = normalizeAnnouncementDisplaySize(announcement.display_size)
  const urgencyMeta = URGENCY_META[urgency]
  const titleFontClass = getAnnouncementTitleFontClass(displayFont)
  const pinned = isAnnouncementPinned(announcement)
  const registrationHref = toSafeHttpUrl(registration_link)
  const deadlineIsActive = isExpiringSoon(expires_at)
  const hasBadgeRow = Boolean(categories) || urgency !== 'normal' || pinned

  return (
    <Link
      href={announcementPath(announcement)}
      data-testid="announcement-card"
      data-image-layout={visual}
      className="card-lift group relative flex h-full min-h-[11rem] flex-col overflow-hidden rounded-[1rem] outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      style={{
        background: 'var(--color-surface)',
        border: `1px solid var(--color-border)`,
        boxShadow: 'var(--shadow-soft)',
      }}
    >
      {/* Category accent bar */}
      <div
        aria-hidden="true"
        className="h-[3px] w-full flex-shrink-0"
        style={{ background: catColor }}
      />

      {/* Banner image — full-width strip (not stamp) */}
      {banner_url && visual !== 'stamp' && (
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
        {/* Category + urgency labels in small-caps */}
        {hasBadgeRow && (
          <div className="announcement-card-badges mb-2.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            {categories && (
              <span
                className="font-mono text-[0.62rem] font-bold tracking-[0.13em] uppercase"
                style={{ color: catColor }}
              >
                {categories.name}
              </span>
            )}
            {(urgency !== 'normal' || pinned) && categories && (
              <span aria-hidden="true" className="text-[var(--color-border)] select-none">
                ·
              </span>
            )}
            {urgency !== 'normal' && (
              <span className="font-mono text-[0.62rem] font-bold tracking-[0.13em] text-[var(--color-accent-inti)] uppercase">
                {urgencyMeta.label}
              </span>
            )}
            {pinned && (
              <span className="font-mono text-[0.62rem] font-bold tracking-[0.13em] text-[var(--color-status-published-text)] uppercase">
                Pinned
              </span>
            )}
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
          className="announcement-card-summary announcement-card-summary-clamp announcement-card-summary-clamp-2 mt-2 text-sm leading-6"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {body ? stripMarkdown(body) : ''}
        </p>

        {/* Stamp thumbnail — shown inline below summary */}
        {banner_url && visual === 'stamp' && (
          <div
            data-card-media="stamp"
            className="relative mt-3 aspect-[4/3] overflow-hidden rounded-[0.8rem]"
            style={{
              background: `color-mix(in oklab, ${catColor} 10%, var(--color-surface-elevated))`,
            }}
          >
            <PosterImage
              src={banner_url}
              alt={title}
              sizes="(max-width: 768px) 100vw, 40vw"
              className="transition-transform duration-500 ease-[var(--ease-ui)] group-hover:scale-[1.015]"
            />
          </div>
        )}

        {/* Footer */}
        <div
          className="announcement-card-footer mt-auto flex items-center justify-between gap-2 border-t pt-3"
          style={{ borderColor: 'var(--color-border-subtle)', marginTop: 'auto' }}
        >
          <span
            className="min-w-0 truncate text-xs font-semibold"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {organizations?.name}
          </span>
          <div className="flex shrink-0 items-center gap-2">
            {deadlineIsActive && expires_at && (
              <span
                className="announcement-card-chip rounded-[0.45rem] px-2 py-0.5 text-[0.68rem] font-bold"
                style={{
                  color: 'var(--color-accent-inti)',
                  background: 'var(--color-accent-surface)',
                }}
              >
                {deadlineLabel(expires_at)}
              </span>
            )}
            {!deadlineIsActive && registrationHref && (
              <span
                className="announcement-card-chip rounded-[0.45rem] px-2 py-0.5 text-[0.68rem] font-bold"
                style={{
                  color: 'var(--color-accent-inti)',
                  background: 'var(--color-accent-surface)',
                }}
              >
                Register
              </span>
            )}
            <span className="font-mono text-[0.62rem] font-bold text-[var(--color-text-muted)]">
              {published_at ? formatDate(published_at) : 'Pending'}
            </span>
          </div>
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

// ── Featured (horizontal on desktop via hero-poster-card CSS) ─────────────────
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

  return (
    <Link
      href={announcementPath(announcement)}
      data-testid="announcement-card"
      data-image-layout={visual}
      className="featured-announcement-card card-lift group relative flex h-full min-h-[18rem] flex-col overflow-hidden rounded-[1.25rem] outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      style={{
        background: 'var(--color-surface)',
        border: `1px solid var(--color-border)`,
        boxShadow: 'var(--shadow-soft)',
      }}
    >
      {/* Image panel (becomes left column on desktop via hero-poster-card CSS) */}
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
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 44vw"
            preload
            className="transition-transform duration-500 ease-[var(--ease-ui)] group-hover:scale-[1.015]"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span
              className="font-display text-8xl leading-none font-bold opacity-[0.15] select-none"
              style={{ color: catColor }}
            >
              {categories?.name?.[0] ?? organizations?.name?.[0] ?? 'B'}
            </span>
          </div>
        )}
      </div>

      {/* Content (becomes right column on desktop via hero-poster-card CSS) */}
      <div className="announcement-card-body flex min-h-0 flex-1 flex-col p-5 sm:p-6">
        {/* Category accent line */}
        <div
          aria-hidden="true"
          className="mb-4 h-0.5 w-10 flex-shrink-0"
          style={{ background: catColor }}
        />

        {/* Category label + status badges */}
        <div className="announcement-card-badges mb-3 flex flex-wrap items-center gap-2">
          {categories && (
            <span
              className="font-mono text-[0.65rem] font-bold tracking-[0.13em] uppercase"
              style={{ color: catColor }}
            >
              {categories.name}
            </span>
          )}
          {urgency !== 'normal' && <StatusChip label={urgencyMeta.label} tone="urgency" />}
          {pinned && <StatusChip label="Pinned" tone="published" />}
          {registrationHref && !expiring && <StatusChip label="Registration open" tone="open" />}
          {expiring && <StatusChip label={`Closes ${formatDate(expires_at!)}`} tone="closing" />}
        </div>

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
          className="announcement-card-summary announcement-card-summary-clamp announcement-card-summary-clamp-3 mt-3 text-base leading-7"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {body ? stripMarkdown(body) : ''}
        </p>

        {/* Inline meta row */}
        <div className="announcement-card-meta mt-5 flex items-center gap-5">
          <div>
            <p className="font-mono text-[0.58rem] font-bold tracking-[0.14em] text-[var(--color-text-muted)] uppercase">
              Issued
            </p>
            <p className="mt-0.5 text-sm font-bold text-[var(--color-text-primary)]">
              {published_at ? formatDate(published_at) : 'Pending'}
            </p>
          </div>
          {expires_at && (
            <>
              <div
                aria-hidden="true"
                className="h-5 w-px"
                style={{ background: 'var(--color-border)' }}
              />
              <div>
                <p className="font-mono text-[0.58rem] font-bold tracking-[0.14em] text-[var(--color-text-muted)] uppercase">
                  Deadline
                </p>
                <p
                  className="mt-0.5 text-sm font-bold"
                  style={{
                    color: deadlineIsActive
                      ? 'var(--color-accent-inti)'
                      : 'var(--color-text-primary)',
                  }}
                >
                  {deadlineLabel(expires_at)}
                </p>
              </div>
            </>
          )}
        </div>

        <div
          className="announcement-card-footer mt-auto flex items-center justify-between gap-3 border-t pt-4"
          style={{ borderColor: 'var(--color-border-subtle)' }}
        >
          <span
            className="min-w-0 truncate text-sm font-medium"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {organizations?.name}
          </span>
          <span className="shrink-0 font-mono text-[0.62rem] font-bold tracking-[0.14em] text-[var(--color-text-muted)] uppercase transition-colors group-hover:text-[var(--color-accent-inti)]">
            Read more →
          </span>
        </div>
      </div>
    </Link>
  )
}
