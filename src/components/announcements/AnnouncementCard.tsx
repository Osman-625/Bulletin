import Link from 'next/link'
import Image from 'next/image'
import type { CSSProperties } from 'react'
import { cn } from '@/shared/utils'
import {
  CARD_TITLE_SIZES,
  FEATURED_TITLE_SIZES,
  URGENCY_META,
  getAnnouncementTitleFontClass,
  isAnnouncementPinned,
  normalizeAnnouncementDisplayFont,
  normalizeAnnouncementDisplaySize,
  normalizeAnnouncementUrgency,
} from '@/modules/announcements/presentation'
import {
  daysUntilDeadline,
  deadlineLabel,
  formatCampusShortDate,
} from '@/modules/announcements/public-board'
import { announcementPath, toSafeHttpUrl, toSafeImageUrl } from '@/modules/announcements/urls'
import { DEFAULT_CATEGORY_DISPLAY_COLOR } from '@/modules/categories/display'
import type { PublicAnnouncement } from '@/shared/types'

export type AnnouncementCardVisual = 'poster' | 'letterbox' | 'stamp' | 'ribbon'

type AnnouncementCardStyle = CSSProperties & {
  '--announcement-card-category-color'?: string
}

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
  fit = 'cover',
  preload = false,
  className,
}: {
  src: string
  alt: string
  sizes: string
  fit?: 'cover' | 'contain'
  preload?: boolean
  className?: string
}) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      className={cn(
        'announcement-card-image block object-center',
        fit === 'contain' ? 'object-contain' : 'object-cover',
        className
      )}
      style={{ objectFit: fit }}
      sizes={sizes}
      preload={preload}
    />
  )
}

// Soft, enlarged copy of the poster that fills the panel behind the card crop,
// so portrait/square posters keep the card frame visually full.
function PosterBackdrop({ src, preload = false }: { src: string; preload?: boolean }) {
  return (
    <>
      <Image
        src={src}
        alt=""
        aria-hidden
        fill
        sizes="320px"
        preload={preload}
        className="scale-110 object-cover object-center blur-2xl"
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
      className="announcement-card-chip inline-flex h-5 max-w-[7.5rem] shrink-0 items-center overflow-hidden rounded-md px-2 text-[0.62rem] leading-none font-bold tracking-tight sm:text-[0.66rem]"
      style={STATUS_CHIP_STYLES[tone]}
    >
      <span className="truncate">{label}</span>
    </span>
  )
}

function CategoryChip({ color, label }: { color: string; label: string }) {
  return (
    <span
      className="announcement-card-chip inline-flex h-5 max-w-[7.5rem] shrink-0 items-center gap-1 overflow-hidden rounded-md border px-2 text-[0.62rem] leading-none font-bold tracking-tight sm:text-[0.66rem]"
      style={categoryBadgeStyle(color)}
    >
      <span
        className="size-1.5 flex-shrink-0 rounded-full"
        style={{ background: color }}
        aria-hidden="true"
      />
      <span className="truncate">{label}</span>
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
  announcement: PublicAnnouncement
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
// The outer Link clips only its own rounded chrome and media crop. The board
// assigns fixed row spans by card type so the footer and crop stay aligned.
function StandardCard({
  announcement,
  visual,
}: {
  announcement: PublicAnnouncement
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
  const imageUrl = toSafeImageUrl(banner_url)
  const hasImage = Boolean(imageUrl)
  const summary = body ? stripMarkdown(body) : 'Details are available in the full notice.'
  const sourceName = organizations?.name ?? 'Campus source'
  const hasBadgeRow =
    urgency !== 'normal' || pinned || Boolean(categories) || Boolean(registrationHref) || expiring
  const cardHref = announcementPath(announcement)
  const titleId = `announcement-card-title-${announcement.id}`
  const cardStyle: AnnouncementCardStyle = {
    '--announcement-card-category-color': catColor,
    background: 'color-mix(in oklab, var(--color-surface) 92%, var(--color-canvas))',
    border: `1px solid color-mix(in oklab, var(--color-border) 82%, var(--color-canvas))`,
    boxShadow: 'var(--shadow-soft)',
  }

  return (
    <article
      aria-labelledby={titleId}
      data-testid="announcement-card"
      data-has-image={hasImage ? 'true' : 'false'}
      data-image-layout={visual}
      data-uniform-card="true"
      data-urgent={urgency !== 'normal' || expiring ? 'true' : undefined}
      className={cn(
        'announcement-card card-lift group relative rounded-[1.25rem]',
        hasImage ? 'card-with-image' : 'card-without-image'
      )}
      style={cardStyle}
    >
      {imageUrl && (
        <div
          data-card-media={visual}
          className="announcement-card-media relative overflow-hidden rounded-t-[1.15rem] border-b border-[var(--color-border-subtle)]"
          style={{
            background:
              visual === 'stamp'
                ? `color-mix(in oklab, ${catColor} 10%, var(--color-surface-elevated))`
                : `color-mix(in oklab, ${catColor} 5%, var(--color-surface-elevated))`,
          }}
        >
          <PosterBackdrop src={imageUrl} />
          <div className="absolute inset-3 overflow-hidden rounded-[0.9rem]">
            <PosterImage
              src={imageUrl}
              alt={title}
              sizes="(max-width: 639px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="transition-transform duration-500 ease-[var(--ease-ui)] group-hover:scale-[1.015]"
            />
          </div>
        </div>
      )}

      <div className="announcement-card-body p-[20px]">
        <div className="announcement-card-main">
          {hasBadgeRow && (
            <div
              className={cn(
                'announcement-card-badges flex flex-wrap items-center gap-1.5',
                hasImage ? 'announcement-card-badges--media mb-3' : 'mb-4'
              )}
            >
              {urgency === 'urgent' && <StatusChip label={urgencyMeta.label} tone="urgency" />}
              {urgency === 'important' && <StatusChip label={urgencyMeta.label} tone="closing" />}
              {pinned && <StatusChip label="Pinned" tone="published" />}
              {categories && <CategoryChip color={catColor} label={categories.name} />}
              {registrationHref && !expiring && (
                <StatusChip label="Registration open" tone="open" />
              )}
              {expiring && <StatusChip label={deadlineLabel(expires_at)} tone="closing" />}
            </div>
          )}

          <h3
            id={titleId}
            className={cn(
              titleFontClass,
              'announcement-card-title leading-[1.06] font-bold tracking-normal'
            )}
            style={{ fontSize: CARD_TITLE_SIZES[displaySize], color: 'var(--color-text-primary)' }}
          >
            {title}
          </h3>

          <p
            className={cn(
              'announcement-card-summary announcement-card-summary-clamp mt-2.5 text-[0.84rem] leading-[1.55] sm:text-[0.9rem]',
              hasImage
                ? 'announcement-card-summary-clamp-3'
                : 'announcement-card-summary-clamp-4 mt-3'
            )}
            data-summary-source-guard="announcement-card-summary-clamp-3 announcement-card-summary-clamp-4"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {summary}
          </p>

          {(published_at || expires_at) && (
            <div className="announcement-card-meta announcement-card-meta-grid mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
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
        </div>

        <div
          className="announcement-card-footer flex items-center justify-between gap-3 border-t pt-3 text-sm"
          style={{ borderColor: 'var(--color-border-subtle)' }}
        >
          <div className="flex min-w-0 flex-col gap-0.5">
            <span
              className="truncate text-[0.78rem] leading-tight font-semibold"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {sourceName}
            </span>
          </div>
          <span className="shrink-0 rounded-[8px] px-2.5 py-1 font-mono text-[0.66rem] font-bold tracking-[0.14em] text-[var(--color-text-muted)] uppercase transition-[background,color] group-hover:bg-[var(--color-accent-surface)] group-hover:text-[var(--color-accent-inti)]">
            Read details
          </span>
        </div>
      </div>
      <Link
        href={cardHref}
        aria-labelledby={titleId}
        className="announcement-card-link absolute inset-0 z-10 rounded-[1.25rem] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-inti)] focus-visible:ring-offset-2"
      >
        <span className="sr-only">Read details for {title}</span>
      </Link>
    </article>
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
  announcement: PublicAnnouncement
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
  const imageUrl = toSafeImageUrl(banner_url)
  const summary = body ? stripMarkdown(body) : 'Details are available in the full notice.'
  const sourceName = organizations?.name ?? 'Campus source'
  const hasBadgeRow =
    urgency !== 'normal' || pinned || Boolean(categories) || Boolean(registrationHref) || expiring
  const hasImage = Boolean(imageUrl)
  const cardHref = announcementPath(announcement)
  const titleId = `featured-announcement-card-title-${announcement.id}`
  const cardStyle: AnnouncementCardStyle = {
    '--announcement-card-category-color': catColor,
    background: 'color-mix(in oklab, var(--color-surface) 94%, var(--color-canvas))',
    border: `1px solid color-mix(in oklab, var(--color-border) 84%, var(--color-canvas))`,
    boxShadow: 'var(--shadow-soft)',
  }

  return (
    <article
      aria-labelledby={titleId}
      data-testid="announcement-card"
      data-has-image={hasImage ? 'true' : 'false'}
      data-image-layout={visual}
      data-urgent={urgency !== 'normal' || expiring ? 'true' : undefined}
      className={cn(
        'announcement-card featured-announcement-card card-lift group relative min-h-0 rounded-[1.35rem]',
        hasImage ? 'card-with-image' : 'card-without-image'
      )}
      style={cardStyle}
    >
      {imageUrl && (
        <div
          data-card-media={visual}
          className={cn(
            'announcement-card-media relative overflow-hidden rounded-t-[1.35rem] border-b border-[var(--color-border-subtle)]',
            visual === 'poster' || visual === 'ribbon'
              ? 'aspect-[4/3] sm:aspect-[16/9] lg:aspect-[16/6]'
              : 'aspect-[16/9]'
          )}
          style={categoryPanelStyle(catColor)}
        >
          <div className="featured-announcement-media-frame absolute inset-2 overflow-hidden rounded-[0.95rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-1.5 shadow-[var(--shadow-soft)] sm:inset-3 sm:p-2">
            <div className="featured-announcement-image-window relative h-full overflow-hidden rounded-[0.72rem] bg-[var(--color-surface-elevated)]">
              <PosterImage
                src={imageUrl}
                alt={title}
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 60vw"
                fit="cover"
                preload
                className="transition-transform duration-500 ease-[var(--ease-ui)] group-hover:scale-[1.015]"
              />
            </div>
            <span className="featured-announcement-corner" aria-hidden="true" />
          </div>
          {/* Editorial badge — overlaid on the image for maximum presence */}
          <div className="featured-card-gradient-scrim absolute right-0 bottom-0 left-0" />
          <span className="featured-announcement-badge absolute top-4 left-4 z-10 rounded-[7px] border px-3 py-1.5 font-mono text-[0.62rem] font-bold tracking-[0.14em] uppercase">
            {featureLabel}
          </span>
        </div>
      )}

      {!imageUrl && (
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
      <div className="announcement-card-body p-4 sm:p-[18px]">
        <div className="announcement-card-main">
          {hasBadgeRow && (
            <div className="announcement-card-badges mb-2.5 flex flex-wrap items-center gap-1.5">
              {urgency === 'urgent' && <StatusChip label={urgencyMeta.label} tone="urgency" />}
              {urgency === 'important' && <StatusChip label={urgencyMeta.label} tone="closing" />}
              {pinned && <StatusChip label="Pinned" tone="published" />}
              {categories && <CategoryChip color={catColor} label={categories.name} />}
              {registrationHref && !expiring && (
                <StatusChip label="Registration open" tone="open" />
              )}
              {expiring && <StatusChip label={deadlineLabel(expires_at)} tone="closing" />}
            </div>
          )}

          <h3
            id={titleId}
            className={cn(
              titleFontClass,
              'announcement-card-title leading-[1.04] font-bold tracking-normal'
            )}
            style={{
              fontSize: `min(${FEATURED_TITLE_SIZES[displaySize]}, 1.5rem)`,
              color: 'var(--color-text-primary)',
            }}
          >
            {title}
          </h3>

          <p
            className="announcement-card-summary announcement-card-summary-clamp announcement-card-summary-clamp-2 mt-2.5 text-[0.84rem] leading-[1.45]"
            data-summary-source-guard="announcement-card-summary-clamp-4"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {summary}
          </p>

          {(published_at || expires_at) && (
            <div className="announcement-card-meta announcement-card-meta-grid mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
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
        </div>

        <div
          className="announcement-card-footer flex items-center justify-between gap-3 border-t pt-3"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="flex min-w-0 flex-col gap-0.5">
            <span
              className="min-w-0 truncate text-sm font-semibold"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {sourceName}
            </span>
          </div>
          <span
            className="shrink-0 rounded-[8px] px-3 py-1.5 text-sm font-bold transition-colors"
            style={{
              background: 'var(--color-accent-surface)',
              color: 'var(--color-accent-hover)',
            }}
          >
            Read details
          </span>
        </div>
      </div>
      <Link
        href={cardHref}
        aria-labelledby={titleId}
        className="announcement-card-link absolute inset-0 z-10 rounded-[1.45rem] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-inti)] focus-visible:ring-offset-2"
      >
        <span className="sr-only">Read details for {title}</span>
      </Link>
    </article>
  )
}
