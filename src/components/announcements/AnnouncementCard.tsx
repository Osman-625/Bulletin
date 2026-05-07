import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import {
  CARD_TITLE_SIZES,
  FEATURED_TITLE_SIZES,
  URGENCY_META,
  getAnnouncementTitleFontClass,
  normalizeAnnouncementDisplayFont,
  normalizeAnnouncementDisplaySize,
  normalizeAnnouncementUrgency,
} from '@/lib/announcements/presentation'
import type { AnnouncementWithRelations } from '@/lib/types'

function stripMarkdown(md: string): string {
  return md
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/\|/g, ' ')
    .replace(/\n+/g, ' ')
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

function PosterImage({
  src,
  alt,
  sizes,
  priority = false,
}: {
  src: string
  alt: string
  sizes: string
  priority?: boolean
}) {
  return (
    <>
      <Image
        src={src}
        alt=""
        fill
        aria-hidden="true"
        className="scale-110 object-cover opacity-45 blur-xl saturate-[1.08]"
        sizes={sizes}
      />
      <div className="absolute inset-0 bg-[var(--color-surface)]/35" aria-hidden="true" />
      <Image
        src={src}
        alt={alt}
        fill
        className="object-contain"
        sizes={sizes}
        priority={priority}
      />
    </>
  )
}

// ── Standard card ──────────────────────────────────────────────────────────────
export default function AnnouncementCard({
  announcement,
  featured = false,
}: {
  announcement: AnnouncementWithRelations
  featured?: boolean
}) {
  return featured ? (
    <FeaturedCard announcement={announcement} />
  ) : (
    <StandardCard announcement={announcement} />
  )
}

// ── Standard (2-col grid) ──────────────────────────────────────────────────────
function StandardCard({ announcement }: { announcement: AnnouncementWithRelations }) {
  const {
    id, title, body, banner_url, published_at, expires_at,
    registration_link, categories, organizations,
  } = announcement

  const catColor = categories?.color ?? '#C8102E'
  const expiring = isExpiringSoon(expires_at)
  const urgency = normalizeAnnouncementUrgency(announcement.urgency)
  const displayFont = normalizeAnnouncementDisplayFont(announcement.display_font)
  const displaySize = normalizeAnnouncementDisplaySize(announcement.display_size)
  const urgencyMeta = URGENCY_META[urgency]
  const titleFontClass = getAnnouncementTitleFontClass(displayFont)

  return (
    <Link
      href={`/announcements/${id}`}
      data-testid="announcement-card"
      className="card-lift group relative flex min-h-[15rem] flex-col overflow-hidden rounded-[18px] outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      style={{
        background: 'var(--color-surface)',
        border: `1px solid var(--color-border)`,
        boxShadow: 'var(--shadow-soft)',
      }}
    >
      {/* Banner */}
      {banner_url && (
        <div
          className="relative aspect-[2/3] overflow-hidden"
          style={{ background: 'var(--color-surface-elevated)' }}
        >
          <PosterImage
            src={banner_url}
            alt={title}
            sizes="(max-width: 640px) 100vw, 50vw"
          />
        </div>
      )}

      <div className="flex flex-1 flex-col gap-4 p-6">
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-1.5">
          {urgency !== 'normal' && (
            <span
              className="rounded-md px-3 py-1.5 text-[1.3125rem] font-semibold"
              style={{ color: urgencyMeta.tone, background: urgencyMeta.background }}
            >
              {urgencyMeta.label}
            </span>
          )}
          {categories && (
            <span
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[1.3125rem] font-semibold"
              style={{ color: catColor, background: catColor + '1A' }}
            >
              <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: catColor }} aria-hidden="true" />
              {categories.name}
            </span>
          )}
          {registration_link && !expiring && (
            <span
              className="rounded-md px-3 py-1.5 text-[1.3125rem] font-semibold"
              style={{ color: 'var(--color-accent-inti)', background: 'rgba(200,16,46,0.09)' }}
            >
              Registration open
            </span>
          )}
          {expiring && (
            <span
              className="rounded-md px-3 py-1.5 text-[1.3125rem] font-semibold"
              style={{ color: 'var(--color-gold)', background: 'rgba(212,148,31,0.12)' }}
            >
              Closing {formatDate(expires_at!)}
            </span>
          )}
        </div>

        {/* Title */}
        <h2
          className={cn(titleFontClass, 'font-semibold leading-[1.18]')}
          style={{ fontSize: CARD_TITLE_SIZES[displaySize], color: 'var(--color-text-primary)' }}
        >
          {title}
        </h2>

        {/* Excerpt */}
        <p
          className="line-clamp-3 flex-1 text-[1.59375rem] leading-[1.65]"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {body ? stripMarkdown(body) : ''}
        </p>

        {/* Footer */}
        <div
          className="flex items-center justify-between gap-2 border-t pt-3"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <span className="truncate text-[1.40625rem] font-medium" style={{ color: 'var(--color-text-muted)' }}>
            {organizations?.name}
          </span>
          {published_at && (
            <span className="flex-shrink-0 text-[1.3125rem]" style={{ color: 'var(--color-text-muted)' }}>
              {formatDate(published_at)}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

// ── Featured (full-width horizontal) ──────────────────────────────────────────
function FeaturedCard({ announcement }: { announcement: AnnouncementWithRelations }) {
  const {
    id, title, body, banner_url, published_at, expires_at,
    registration_link, categories, organizations,
  } = announcement

  const catColor = categories?.color ?? '#C8102E'
  const expiring = isExpiringSoon(expires_at)
  const urgency = normalizeAnnouncementUrgency(announcement.urgency)
  const displayFont = normalizeAnnouncementDisplayFont(announcement.display_font)
  const displaySize = normalizeAnnouncementDisplaySize(announcement.display_size)
  const urgencyMeta = URGENCY_META[urgency]
  const titleFontClass = getAnnouncementTitleFontClass(displayFont)

  return (
    <Link
      href={`/announcements/${id}`}
      data-testid="announcement-card"
      className="card-lift group relative grid overflow-hidden rounded-[24px] outline-none focus-visible:ring-2 focus-visible:ring-offset-2 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)]"
      style={{
        background: 'var(--color-surface)',
        border: `1px solid var(--color-border)`,
        boxShadow: 'var(--shadow-soft)',
        minHeight: 300,
      }}
    >
      {/* Content — left side */}
      <div className="flex min-h-[18rem] flex-col justify-between p-7 sm:p-8 lg:p-10">
        {/* Badges */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {urgency !== 'normal' && (
            <span
              className="rounded-md px-3 py-1.5 text-[1.3125rem] font-semibold"
              style={{ color: urgencyMeta.tone, background: urgencyMeta.background }}
            >
              {urgencyMeta.label}
            </span>
          )}
          {categories && (
            <span
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[1.3125rem] font-semibold"
              style={{ color: catColor, background: catColor + '1A' }}
            >
              <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: catColor }} aria-hidden="true" />
              {categories.name}
            </span>
          )}
          {registration_link && !expiring && (
            <span
              className="rounded-md px-3 py-1.5 text-[1.3125rem] font-semibold"
              style={{ color: 'var(--color-accent-inti)', background: 'rgba(200,16,46,0.09)' }}
            >
              Registration open
            </span>
          )}
          {expiring && (
            <span
              className="rounded-md px-3 py-1.5 text-[1.3125rem] font-semibold"
              style={{ color: 'var(--color-gold)', background: 'rgba(212,148,31,0.12)' }}
            >
              Closing {formatDate(expires_at!)}
            </span>
          )}
        </div>

        {/* Title — larger for featured */}
        <h2
          className={cn(titleFontClass, 'mb-4 font-semibold leading-[1.08]')}
          style={{ fontSize: FEATURED_TITLE_SIZES[displaySize], color: 'var(--color-text-primary)' }}
        >
          {title}
        </h2>

        {/* Excerpt — 3 lines */}
        <p
          className="mb-6 line-clamp-4 flex-1 text-[1.6875rem] leading-[1.7]"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {body ? stripMarkdown(body) : ''}
        </p>

        {/* Footer */}
        <div
          className="flex items-center justify-between gap-2 border-t pt-4"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <span className="truncate text-[1.40625rem] font-medium" style={{ color: 'var(--color-text-muted)' }}>
            {organizations?.name}
          </span>
          {published_at && (
            <span className="flex-shrink-0 text-[1.40625rem]" style={{ color: 'var(--color-text-muted)' }}>
              {formatDate(published_at)}
            </span>
          )}
        </div>
      </div>

      {/* Visual panel — right side */}
      <div
        className="relative aspect-[2/3] overflow-hidden lg:min-h-full"
        style={{ background: catColor + '14' }}
      >
        {banner_url ? (
          <PosterImage
            src={banner_url}
            alt={title}
            sizes="(max-width: 1024px) 100vw, 40vw"
            priority
          />
        ) : (
          // No banner: typographic placeholder using category initial
          <div className="flex h-full items-center justify-center">
            <span
              className="font-display font-bold select-none leading-none opacity-[0.18]"
              style={{ fontSize: 'clamp(7.5rem, 15vw, 13.5rem)', color: catColor }}
            >
              {categories?.name?.[0] ?? organizations?.name?.[0] ?? 'B'}
            </span>
          </div>
        )}
      </div>
    </Link>
  )
}
