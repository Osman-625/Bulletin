export const ANNOUNCEMENT_URGENCIES = ['normal', 'important', 'urgent'] as const
export const ANNOUNCEMENT_DISPLAY_FONTS = ['editorial', 'clean'] as const
export const ANNOUNCEMENT_DISPLAY_SIZES = ['compact', 'standard', 'large'] as const

export type AnnouncementUrgency = (typeof ANNOUNCEMENT_URGENCIES)[number]
export type AnnouncementDisplayFont = (typeof ANNOUNCEMENT_DISPLAY_FONTS)[number]
export type AnnouncementDisplaySize = (typeof ANNOUNCEMENT_DISPLAY_SIZES)[number]

export const DEFAULT_URGENCY: AnnouncementUrgency = 'normal'
export const DEFAULT_DISPLAY_FONT: AnnouncementDisplayFont = 'editorial'
export const DEFAULT_DISPLAY_SIZE: AnnouncementDisplaySize = 'standard'

export const URGENCY_META: Record<
  AnnouncementUrgency,
  { label: string; tone: string; background: string; rank: number }
> = {
  normal: {
    label: 'Standard',
    tone: 'var(--color-text-muted)',
    background: 'var(--color-surface-elevated)',
    rank: 0,
  },
  important: {
    label: 'Important',
    tone: 'var(--color-gold)',
    background: 'rgba(212, 148, 31, 0.14)',
    rank: 1,
  },
  urgent: {
    label: 'Urgent',
    tone: 'var(--color-accent-inti)',
    background: 'var(--color-accent-surface)',
    rank: 2,
  },
}

export const DISPLAY_FONT_LABELS: Record<AnnouncementDisplayFont, string> = {
  editorial: 'Editorial',
  clean: 'Clean',
}

export const DISPLAY_SIZE_LABELS: Record<AnnouncementDisplaySize, string> = {
  compact: 'Compact',
  standard: 'Standard',
  large: 'Large',
}

export const CARD_TITLE_SIZES: Record<AnnouncementDisplaySize, string> = {
  compact: '1.5rem',
  standard: '1.75rem',
  large: '2rem',
}

export const FEATURED_TITLE_SIZES: Record<AnnouncementDisplaySize, string> = {
  compact: '2rem',
  standard: '2.5rem',
  large: '3rem',
}

export const DETAIL_TITLE_SIZES: Record<AnnouncementDisplaySize, string> = {
  compact: '2.5rem',
  standard: '3rem',
  large: '3.5rem',
}

export const DETAIL_BODY_SIZES: Record<AnnouncementDisplaySize, string> = {
  compact: '1rem',
  standard: '1.125rem',
  large: '1.25rem',
}

function normalizeOption<T extends readonly string[]>(
  value: FormDataEntryValue | string | null | undefined,
  options: T,
  fallback: T[number]
): T[number] {
  if (typeof value !== 'string') return fallback
  return options.includes(value) ? value : fallback
}

export function normalizeAnnouncementUrgency(
  value: FormDataEntryValue | string | null | undefined
): AnnouncementUrgency {
  return normalizeOption(value, ANNOUNCEMENT_URGENCIES, DEFAULT_URGENCY)
}

export function normalizeAnnouncementDisplayFont(
  value: FormDataEntryValue | string | null | undefined
): AnnouncementDisplayFont {
  return normalizeOption(value, ANNOUNCEMENT_DISPLAY_FONTS, DEFAULT_DISPLAY_FONT)
}

export function normalizeAnnouncementDisplaySize(
  value: FormDataEntryValue | string | null | undefined
): AnnouncementDisplaySize {
  return normalizeOption(value, ANNOUNCEMENT_DISPLAY_SIZES, DEFAULT_DISPLAY_SIZE)
}

export function getAnnouncementTitleFontClass(font: AnnouncementDisplayFont) {
  return font === 'clean' ? 'font-sans' : 'font-display'
}

export function isAnnouncementPinned(announcement: { pinned_until?: string | null }, now = Date.now()) {
  if (!announcement.pinned_until) return false
  const pinnedUntil = new Date(announcement.pinned_until).getTime()
  return !Number.isNaN(pinnedUntil) && pinnedUntil > now
}

export function sortAnnouncementsForFeed<
  T extends { urgency?: string | null; published_at?: string | null; pinned_until?: string | null },
>(announcements: T[]): T[] {
  const now = Date.now()

  return [...announcements].sort((a, b) => {
    const pinnedDiff = Number(isAnnouncementPinned(b, now)) - Number(isAnnouncementPinned(a, now))
    if (pinnedDiff !== 0) return pinnedDiff

    const urgencyDiff =
      URGENCY_META[normalizeAnnouncementUrgency(b.urgency)].rank -
      URGENCY_META[normalizeAnnouncementUrgency(a.urgency)].rank
    if (urgencyDiff !== 0) return urgencyDiff

    const bDate = b.published_at ? new Date(b.published_at).getTime() : 0
    const aDate = a.published_at ? new Date(a.published_at).getTime() : 0
    return bDate - aDate
  })
}
