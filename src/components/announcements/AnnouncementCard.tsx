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
import {
  daysUntilDeadline,
  deadlineLabel,
  formatCampusShortDate,
} from '@/lib/announcements/public-board'
import { announcementPath, toSafeHttpUrl } from '@/lib/announcements/urls'
import { DEFAULT_CATEGORY_DISPLAY_COLOR } from '@/lib/categories/display'
import type { AnnouncementWithRelations } from '@/lib/types'

export type AnnouncementCardVisual = 'poster' | 'letterbox' | 'stamp' | 'ribbon'

const STATUS_CHIP_STYLES: Record<'urgency' | 'published' | 'open' | 'closing', CSSProperties> = {
  urgency: {
    color: 'var(--color-on-accent)',
    background: 'var(--color-accent-inti)',
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

function isExpiringSoon(expiresAt: string | null): boolean {
  const days = daysUntilDeadline(expiresAt)
  return days !== null && days <= 7
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
    background: `color-mix(in oklab, ${color} 6%, var(--color-surface-elevated))`,
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

// Soft, enlarged copy of the poster that fills the panel behind the contained
// image, so portrait/square posters leave no empty mat — the poster itself is
// never cropped, the blur just extends it to the frame edges.
function PosterBackdrop({ src }: { src: string }) {
  return (
    <>
      <Image
        src={src}
        alt=""
        aria-hidden
        fill
        sizes="320px"
        className="scale-110 object-cover blur-2xl"
      />
      <div
        className="absolute inset-0"
        style={{
          background: 'color-mix(in oklab, var(--color-surface-elevated) 34%, transparent)',
        }}
      />
    </>
  )
}

function StatusChip({
  label,
  tone,
}: {
  label: string
  tone: 'urgency' | 'published' | 'open' | 'closing'
}) {
  return (
    <span
      className="announcement-card-chip rounded-md px-2.5 py-1.5 text-[0.72rem] font-bold sm:text-[0.76rem]"
      style={STATUS_CHIP_STYLES[tone]}
    >
      {label}
    </span>
  )
}

function CategoryChip({ color, label }: { color: string; label: string }) {
  return (
    <span
      className="announcement-card-chip inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[0.72rem] font-bold sm:text-[0.76rem]"
      style={categoryBadgeStyle(color)}
    >
      <span
        className="size-1.5 flex-shrink-0 rounded-full"
        style={{ background: color }}
        aria-hidden="true"
      />
      {label}
    </span>
  )
}

function EventMetaPill({
  label,
  value,
  tone = 'neutral',
}: {
  label: string
  value: string
  tone?: 'neutral' | 'deadline'
}) {
  const style: CSSProperties =
    tone === 'deadline'
      ? {
          background: 'var(--color-deadline-surface)',
          borderColor: 'color-mix(in oklab, var(--color-gold) 42%, var(--color-border))',
        }
      : {
          background:
            'color-mix(in oklab, var(--color-surface-elevated) 54%, var(--color-surface))',
          borderColor: 'var(--color-border-subtle)',
        }

  return (
    <span className="min-w-0 rounded-[0.65rem] border px-3 py-2" style={style}>
      <span className="block font-mono text-[0.58rem] leading-none font-bold tracking-[0.13em] text-[var(--color-text-muted)] uppercase">
        {label}
      </span>
      <span className="mt-1 block truncate text-[0.78rem] leading-tight font-bold text-[var(--color-text-primary)]">
        {value}
      </span>
    </span>
  )
}

// ── Standard card ──────────────────────────────────────────────────────────────
export default function AnnouncementCard({
  announcement,
  featured = false,
  featureLabel,
  visual = 'letterbox',
}: {
  announcement: AnnouncementWithRelations
  featured?: boolean
  featureLabel?: string
  visual?: AnnouncementCardVisual
}) {
  return featured ? (
    <FeaturedCard announcement={announcement} visual={visual} featureLabel={featureLabel} />
  ) : (
    <StandardCard announcement={announcement} visual={visual} />
  )
}

// ── Standard (grid) ────────────────────────────────────────────────────────────
// The outer Link clips to its rounded corners with overflow-hidden so the image
// panel and card chrome share one radius. Card heights are locked by the board
// CSS into two interlocking sizes (image = 2× text); long copy is clipped, not
// grown, and the image panel flex-fills its height so nothing is left empty.
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

  const catColor = categories?.color ?? DEFAULT_CATEGORY_DISPLAY_COLOR
  const expiring = isExpiringSoon(expires_at)
  const urgency = normalizeAnnouncementUrgency(announcement.urgency)
  const displayFont = normalizeAnnouncementDisplayFont(announcement.display_font)
  const displaySize = normalizeAnnouncementDisplaySize(announcement.display_size)
  const urgencyMeta = URGENCY_META[urgency]
  const titleFontClass = getAnnouncementTitleFontClass(displayFont)
  const pinned = isAnnouncementPinned(announcement)
  const registrationHref = toSafeHttpUrl(registration_link)
  const hasImage = Boolean(banner_url)
  const hasBadgeRow =
    urgency !== 'normal' || pinned || Boolean(categories) || Boolean(registrationHref) || expiring

  return (
    <Link
      href={announcementPath(announcement)}
      data-testid="announcement-card"
      data-has-image={banner_url ? 'true' : 'false'}
      data-image-layout={visual}
      data-uniform-card="true"
      className={cn(
        'card-lift group relative flex h-full flex-col overflow-hidden rounded-[1.25rem] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-inti)] focus-visible:ring-offset-2',
        hasImage ? 'card-with-image' : 'card-without-image'
      )}
      style={{
        background: 'color-mix(in oklab, var(--color-surface) 92%, var(--color-canvas))',
        border: `1px solid color-mix(in oklab, var(--color-border) 82%, var(--color-canvas))`,
        boxShadow: 'var(--shadow-soft)',
      }}
    >
      {banner_url && (
        <div
          data-card-media={visual}
          className="relative aspect-[16/9] flex-shrink-0 overflow-hidden rounded-t-[1.15rem] border-b border-[var(--color-border-subtle)]"
          style={{
            background:
              visual === 'stamp'
                ? `color-mix(in oklab, ${catColor} 10%, var(--color-surface-elevated))`
                : `color-mix(in oklab, ${catColor} 5%, var(--color-surface-elevated))`,
          }}
        >
          <PosterBackdrop src={banner_url} />
          <div className="absolute inset-2 overflow-hidden rounded-[0.75rem] sm:inset-3">
            <PosterImage
              src={banner_url}
              alt={title}
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 31vw"
              className="transition-transform duration-500 ease-[var(--ease-ui)] group-hover:scale-[1.015]"
            />
          </div>
        </div>
      )}

      {!banner_url && (
        <div
          className="announcement-card-folio-strip h-2 flex-shrink-0"
          style={{
            background: `linear-gradient(90deg, color-mix(in oklab, ${catColor} 28%, var(--color-surface-elevated)), color-mix(in oklab, var(--color-surface-elevated) 64%, var(--color-surface)))`,
          }}
          aria-hidden="true"
        />
      )}

      <div className="announcement-card-body flex min-h-0 flex-1 flex-col p-4 sm:p-5">
        {hasBadgeRow && (
          <div
            className={cn(
              'announcement-card-badges flex flex-wrap items-center gap-1.5',
              hasImage ? 'mb-3' : 'mb-4'
            )}
          >
            {urgency === 'urgent' && <StatusChip label={urgencyMeta.label} tone="urgency" />}
            {urgency === 'important' && <StatusChip label={urgencyMeta.label} tone="closing" />}
            {pinned && <StatusChip label="Pinned" tone="published" />}
            {categories && <CategoryChip color={catColor} label={categories.name} />}
            {registrationHref && !expiring && <StatusChip label="Registration open" tone="open" />}
            {expiring && <StatusChip label={deadlineLabel(expires_at)} tone="closing" />}
          </div>
        )}

        <h2
          className={cn(
            titleFontClass,
            'announcement-card-title leading-[1.06] font-bold tracking-[-0.01em]'
          )}
          style={{ fontSize: CARD_TITLE_SIZES[displaySize], color: 'var(--color-text-primary)' }}
        >
          {title}
        </h2>

        <p
          className={cn(
            'announcement-card-summary mt-2.5 text-[0.84rem] leading-[1.55] sm:text-[0.9rem]',
            hasImage ? '' : 'mt-3'
          )}
          data-summary-source-guard="announcement-card-summary-clamp-2 announcement-card-summary-clamp-3 announcement-card-summary-clamp-4"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {body ? stripMarkdown(body) : ''}
        </p>

        {(published_at || expires_at) && (
          <div className="announcement-card-meta-grid mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {published_at && (
              <EventMetaPill label="Posted" value={formatCampusShortDate(published_at)} />
            )}
            {expires_at && (
              <EventMetaPill
                label="Deadline"
                value={deadlineLabel(expires_at)}
                tone={expiring ? 'deadline' : 'neutral'}
              />
            )}
          </div>
        )}

        {/* Footer anchored to bottom; mt-auto collapses dead space on short cards */}
        <div
          className="announcement-card-footer mt-auto flex items-center justify-between gap-3 border-t pt-3 text-sm"
          style={{ borderColor: 'var(--color-border-subtle)', marginTop: 'auto' }}
        >
          <div className="flex min-w-0 flex-col gap-0.5">
            <span
              className="truncate text-[0.78rem] leading-tight font-semibold"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {organizations?.name}
            </span>
          </div>
          <span className="shrink-0 rounded-[8px] px-2.5 py-1 font-mono text-[0.66rem] font-bold tracking-[0.14em] text-[var(--color-text-muted)] uppercase transition-[background,color] group-hover:bg-[var(--color-accent-surface)] group-hover:text-[var(--color-accent-inti)]">
            Read details
          </span>
        </div>
      </div>
    </Link>
  )
}

// ── Featured (hero — full-width editorial) ─────────────────────────────────────
// Visually distinct from StandardCard: larger image panel, wider aspect ratio,
// bigger title, 4-line summary, and a prominent editorial-style feature badge.
function FeaturedCard({
  announcement,
  featureLabel = 'Featured',
  visual,
}: {
  announcement: AnnouncementWithRelations
  featureLabel?: string
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

  const catColor = categories?.color ?? DEFAULT_CATEGORY_DISPLAY_COLOR
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
      data-has-image={banner_url ? 'true' : 'false'}
      data-image-layout={visual}
      className="featured-announcement-card card-lift group relative flex h-full min-h-[20rem] flex-col overflow-hidden rounded-[1.45rem] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-inti)] focus-visible:ring-offset-2"
      style={{
        background: 'color-mix(in oklab, var(--color-surface) 94%, var(--color-canvas))',
        border: `1px solid color-mix(in oklab, var(--color-border) 84%, var(--color-canvas))`,
        boxShadow: 'var(--shadow-soft)',
      }}
    >
      {banner_url && (
        <div
          data-card-media={visual}
          className={cn(
            'relative flex-shrink-0 overflow-hidden rounded-t-[1.35rem] border-b border-[var(--color-border-subtle)]',
            visual === 'ribbon' ? 'aspect-[21/9]' : 'aspect-[16/9] sm:aspect-[16/10]'
          )}
          style={categoryPanelStyle(catColor)}
        >
          <PosterBackdrop src={banner_url} />
          <div className="absolute inset-2 overflow-hidden rounded-[0.85rem] sm:inset-3">
            <PosterImage
              src={banner_url}
              alt={title}
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 60vw"
              preload
              className="transition-transform duration-500 ease-[var(--ease-ui)] group-hover:scale-[1.015]"
            />
          </div>
          {/* Editorial badge — overlaid on the image for maximum presence */}
          <div className="featured-card-gradient-scrim absolute right-0 bottom-0 left-0" />
          <span className="featured-announcement-badge absolute top-4 left-4 z-10 rounded-[7px] border px-3 py-1.5 font-mono text-[0.62rem] font-bold tracking-[0.14em] uppercase">
            {featureLabel}
          </span>
        </div>
      )}

      {!banner_url && (
        <div
          className="featured-card-no-image-header flex-shrink-0 border-b border-[var(--color-border-subtle)] px-5 pt-5 pb-4"
          style={{
            background: `color-mix(in oklab, ${catColor} 8%, var(--color-surface-elevated))`,
          }}
        >
          <span className="featured-announcement-badge inline-flex rounded-[7px] border px-3 py-1.5 font-mono text-[0.62rem] font-bold tracking-[0.14em] uppercase">
            {featureLabel}
          </span>
        </div>
      )}

      {/* Content body */}
      <div className="announcement-card-body flex min-h-0 flex-1 flex-col p-4 sm:p-5">
        {hasBadgeRow && (
          <div className="announcement-card-badges mb-3.5 flex flex-wrap items-center gap-2">
            {urgency === 'urgent' && <StatusChip label={urgencyMeta.label} tone="urgency" />}
            {urgency === 'important' && <StatusChip label={urgencyMeta.label} tone="closing" />}
            {pinned && <StatusChip label="Pinned" tone="published" />}
            {categories && <CategoryChip color={catColor} label={categories.name} />}
            {registrationHref && !expiring && <StatusChip label="Registration open" tone="open" />}
            {expiring && <StatusChip label={deadlineLabel(expires_at)} tone="closing" />}
          </div>
        )}

        <h2
          className={cn(
            titleFontClass,
            'announcement-card-title leading-[1.04] font-bold tracking-[-0.02em]'
          )}
          style={{
            fontSize: `min(${FEATURED_TITLE_SIZES[displaySize]}, 2.25rem)`,
            color: 'var(--color-text-primary)',
          }}
        >
          {title}
        </h2>

        <p
          className="announcement-card-summary mt-3 text-[0.95rem] leading-[1.65]"
          data-summary-source-guard="announcement-card-summary-clamp-4"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {body ? stripMarkdown(body) : ''}
        </p>

        {(published_at || expires_at) && (
          <div className="announcement-card-meta-grid mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {published_at && (
              <EventMetaPill label="Posted" value={formatCampusShortDate(published_at)} />
            )}
            {expires_at && (
              <EventMetaPill
                label="Deadline"
                value={deadlineLabel(expires_at)}
                tone={deadlineIsActive ? 'deadline' : 'neutral'}
              />
            )}
          </div>
        )}

        <div
          className="announcement-card-footer mt-auto flex items-center justify-between gap-3 border-t pt-4"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="flex min-w-0 flex-col gap-0.5">
            <span
              className="min-w-0 truncate text-sm font-semibold"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {organizations?.name}
            </span>
          </div>
          <span
            className="shrink-0 rounded-[8px] px-4 py-2 text-sm font-bold transition-colors"
            style={{
              background: 'var(--color-accent-surface)',
              color: 'var(--color-accent-hover)',
            }}
          >
            Read notice
          </span>
        </div>
      </div>
    </Link>
  )
}
