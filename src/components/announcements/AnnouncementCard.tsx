import Image from 'next/image'
import Link from 'next/link'
import type { CSSProperties } from 'react'

import {
  URGENCY_META,
  getAnnouncementTitleFontClass,
  isAnnouncementPinned,
  normalizeAnnouncementDisplayFont,
  normalizeAnnouncementUrgency,
} from '@/modules/announcements/presentation'
import {
  daysUntilDeadline,
  deadlineLabel,
  formatCampusShortDate,
} from '@/modules/announcements/public-board'
import { announcementPath, toSafeHttpUrl, toSafeImageUrl } from '@/modules/announcements/urls'
import { DEFAULT_CATEGORY_DISPLAY_COLOR } from '@/modules/categories/display'
import { cn } from '@/shared/utils'
import type { PublicAnnouncement } from '@/shared/types'

export type AnnouncementCardVisual = 'poster' | 'letterbox' | 'stamp' | 'ribbon'

type StatusTone = 'urgency' | 'published' | 'open' | 'closing'

export type CardStatusItem = {
  key: string
  label: string
  tone: StatusTone
  categoryColor?: string
}

type AnnouncementCardStyle = CSSProperties & {
  '--announcement-card-category-color'?: string
}

const STATUS_CHIP_STYLES: Record<StatusTone, CSSProperties> = {
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

function stripMarkdown(markdown: string): string {
  return markdown
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

function StatusChip({ item }: { item: CardStatusItem }) {
  if (item.categoryColor) {
    return (
      <span
        className="announcement-card-chip gap-1 overflow-hidden rounded-md border text-[0.68rem] font-bold tracking-tight sm:text-[0.72rem]"
        style={categoryBadgeStyle(item.categoryColor)}
      >
        <span
          className="size-1.5 shrink-0 rounded-full"
          style={{ background: item.categoryColor }}
          aria-hidden="true"
        />
        <span className="truncate">{item.label}</span>
      </span>
    )
  }

  return (
    <span
      className="announcement-card-chip overflow-hidden rounded-md text-[0.68rem] font-bold tracking-tight sm:text-[0.72rem]"
      style={STATUS_CHIP_STYLES[item.tone]}
    >
      <span className="truncate">{item.label}</span>
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
    <span
      className="announcement-card-meta-box min-w-0 rounded-[0.65rem] border px-3 py-2"
      style={style}
    >
      <span className="block font-mono text-[0.58rem] leading-none font-bold tracking-[0.13em] text-[var(--color-text-muted)] uppercase">
        {label}
      </span>
      <span className="mt-1 block truncate text-[0.78rem] leading-tight font-bold text-[var(--color-text-primary)]">
        {value}
      </span>
    </span>
  )
}

export function CardImage({
  src,
  alt,
  categoryColor,
  visual,
  preload = false,
  sizes,
}: {
  src: string | null
  alt: string
  categoryColor: string
  visual: AnnouncementCardVisual
  preload?: boolean
  sizes: string
}) {
  if (!src) return null

  return (
    <div
      data-card-media={visual}
      data-slot="image"
      className="announcement-card-media relative overflow-hidden rounded-t-[1.15rem] border-b border-[var(--color-border-subtle)]"
      style={{
        background: `color-mix(in oklab, ${categoryColor} 6%, var(--color-surface-elevated))`,
      }}
    >
      <Image
        src={src}
        alt=""
        aria-hidden="true"
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
      <div className="announcement-card-image-frame absolute inset-0 overflow-hidden">
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          preload={preload}
          className="announcement-card-image block object-contain object-center"
          // Foreground artwork stays uncropped while the backdrop fills the fixed media slot.
          style={{ objectFit: 'contain' }}
        />
      </div>
    </div>
  )
}

export function StatusBadge({ items }: { items: CardStatusItem[] }) {
  return (
    <div
      data-slot="status"
      data-slot-empty={items.length === 0 ? 'true' : undefined}
      aria-hidden={items.length === 0 ? true : undefined}
      className="announcement-card-status announcement-card-badges whitespace-nowrap"
    >
      {items.map((item) => (
        <StatusChip key={item.key} item={item} />
      ))}
    </div>
  )
}

export function CardTitle({
  id,
  title,
  fontClass,
}: {
  id: string
  title: string
  fontClass: string
}) {
  return (
    <h3
      id={id}
      data-slot="title"
      className={cn(
        fontClass,
        'announcement-card-title text-[1.28rem] leading-[1.16] font-bold tracking-normal text-[var(--color-text-primary)]'
      )}
    >
      {title}
    </h3>
  )
}

export function CardDescription({ description }: { description: string }) {
  return (
    <p
      data-slot="description"
      className="announcement-card-summary announcement-card-summary-clamp text-[0.84rem] leading-[1.5] text-[var(--color-text-secondary)] sm:text-[0.9rem]"
    >
      {description}
    </p>
  )
}

export function CardMetaInfo({
  publishedAt,
  expiresAt,
  deadlineIsActive,
}: {
  publishedAt: string | null
  expiresAt: string | null
  deadlineIsActive: boolean
}) {
  const postedValue = publishedAt ? formatCampusShortDate(publishedAt) : 'Pending'
  const deadlineValue = expiresAt ? deadlineLabel(expiresAt) : 'No deadline'

  return (
    <div data-slot="meta" className="announcement-card-meta announcement-card-meta-grid grid gap-2">
      <EventMetaPill label="Posted" value={postedValue} />
      <EventMetaPill
        label="Deadline"
        value={deadlineValue}
        tone={deadlineIsActive ? 'deadline' : 'neutral'}
      />
    </div>
  )
}

export function CardFooter({ sourceName }: { sourceName: string }) {
  return (
    <div
      data-slot="footer"
      className="announcement-card-footer flex items-center justify-between gap-3 border-t text-sm"
      style={{ borderColor: 'var(--color-border-subtle)' }}
    >
      <span className="min-w-0 truncate text-[0.78rem] leading-tight font-semibold text-[var(--color-text-muted)]">
        {sourceName}
      </span>
      <span className="shrink-0 rounded-[8px] px-2.5 py-1 font-mono text-[0.66rem] font-bold tracking-[0.14em] text-[var(--color-text-muted)] uppercase transition-[background,color] group-hover:bg-[var(--color-accent-surface)] group-hover:text-[var(--color-accent-inti)]">
        Read details
      </span>
    </div>
  )
}

function createStatusItems({
  announcement,
  categoryColor,
  expiring,
  registrationIsOpen,
  featureLabel,
}: {
  announcement: PublicAnnouncement
  categoryColor: string
  expiring: boolean
  registrationIsOpen: boolean
  featureLabel?: string
}): CardStatusItem[] {
  const urgency = normalizeAnnouncementUrgency(announcement.urgency)
  const items: CardStatusItem[] = []

  if (featureLabel) {
    items.push({ key: 'feature', label: featureLabel, tone: 'published' })
  }
  if (urgency === 'urgent') {
    items.push({ key: 'urgency', label: URGENCY_META[urgency].label, tone: 'urgency' })
  }
  if (urgency === 'important') {
    items.push({ key: 'urgency', label: URGENCY_META[urgency].label, tone: 'closing' })
  }
  if (isAnnouncementPinned(announcement) && featureLabel?.toLowerCase() !== 'pinned') {
    items.push({ key: 'pinned', label: 'Pinned', tone: 'published' })
  }
  if (announcement.categories) {
    items.push({
      key: 'category',
      label: announcement.categories.name,
      tone: 'published',
      categoryColor,
    })
  }
  if (registrationIsOpen && !expiring) {
    items.push({ key: 'registration', label: 'Registration open', tone: 'open' })
  }
  if (expiring) {
    items.push({
      key: 'deadline',
      label: deadlineLabel(announcement.expires_at),
      tone: 'closing',
    })
  }

  return items
}

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
  const categoryColor = announcement.categories?.color ?? DEFAULT_CATEGORY_DISPLAY_COLOR
  const expiring = isExpiringSoon(announcement.expires_at)
  const urgency = normalizeAnnouncementUrgency(announcement.urgency)
  const imageUrl = toSafeImageUrl(announcement.banner_url)
  const hasImage = Boolean(imageUrl)
  const registrationIsOpen = Boolean(toSafeHttpUrl(announcement.registration_link))
  const titleFontClass = getAnnouncementTitleFontClass(
    normalizeAnnouncementDisplayFont(announcement.display_font)
  )
  const titleId = `announcement-card-title-${announcement.id}`
  const statusItems = createStatusItems({
    announcement,
    categoryColor,
    expiring,
    registrationIsOpen,
    featureLabel: featured ? (featureLabel ?? 'Featured') : undefined,
  })
  const cardStyle: AnnouncementCardStyle = {
    '--announcement-card-category-color': categoryColor,
    background: `color-mix(in oklab, var(--color-surface) ${featured ? '94%' : '92%'}, var(--color-canvas))`,
    border: `1px solid color-mix(in oklab, var(--color-border) ${featured ? '84%' : '82%'}, var(--color-canvas))`,
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
      data-featured={featured ? 'true' : undefined}
      className={cn(
        'announcement-card card-lift group relative rounded-[1.25rem]',
        featured && 'featured-announcement-card',
        hasImage ? 'card-with-image' : 'card-without-image'
      )}
      style={cardStyle}
    >
      <CardImage
        src={imageUrl}
        alt={announcement.title}
        categoryColor={categoryColor}
        visual={visual}
        preload={featured}
        sizes={
          featured
            ? '(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 60vw'
            : '(max-width: 639px) 100vw, (max-width: 1024px) 50vw, 33vw'
        }
      />

      <div className="announcement-card-body">
        <StatusBadge items={statusItems} />
        <CardTitle id={titleId} title={announcement.title} fontClass={titleFontClass} />
        <CardDescription
          description={
            announcement.body
              ? stripMarkdown(announcement.body)
              : 'Details are available in the full notice.'
          }
        />
        <CardMetaInfo
          publishedAt={announcement.published_at}
          expiresAt={announcement.expires_at}
          deadlineIsActive={expiring}
        />
        <CardFooter sourceName={announcement.organizations?.name ?? 'Campus source'} />
      </div>

      <Link
        href={announcementPath(announcement)}
        aria-labelledby={titleId}
        className="announcement-card-link absolute inset-0 z-10 rounded-[1.25rem] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-inti)] focus-visible:ring-offset-2"
      >
        <span className="sr-only">Read details for {announcement.title}</span>
      </Link>
    </article>
  )
}
