import type { PublicAnnouncement } from '@/shared/types'
import {
  URGENCY_META,
  isAnnouncementPinned,
  normalizeAnnouncementUrgency,
} from '@/modules/announcements/presentation'

export const CAMPUS_TIME_ZONE = 'Asia/Kuala_Lumpur'
export const BOARD_SORTS = ['priority', 'issued', 'closing'] as const

const CAMPUS_DAY_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: CAMPUS_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const CAMPUS_DATE_FORMATTERS = {
  compact: new Intl.DateTimeFormat('en-MY', {
    timeZone: CAMPUS_TIME_ZONE,
    day: 'numeric',
    month: 'short',
  }),
  short: new Intl.DateTimeFormat('en-MY', {
    timeZone: CAMPUS_TIME_ZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }),
  long: new Intl.DateTimeFormat('en-MY', {
    timeZone: CAMPUS_TIME_ZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }),
  dayShort: new Intl.DateTimeFormat('en-MY', {
    timeZone: CAMPUS_TIME_ZONE,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }),
  dateTime: new Intl.DateTimeFormat('en-MY', {
    timeZone: CAMPUS_TIME_ZONE,
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }),
} as const

type CampusDateInput = Date | number | string | null | undefined
type CampusDateFormat = keyof typeof CAMPUS_DATE_FORMATTERS

export type BoardSort = (typeof BOARD_SORTS)[number]
export type BoardSectionId = 'daily' | 'closing' | 'future' | 'campus'
type PublicBoardSortable = Pick<
  PublicAnnouncement,
  'expires_at' | 'pinned_until' | 'published_at' | 'urgency'
>

export const BOARD_SORT_OPTIONS: Array<{
  sort: BoardSort
  label: string
  eyebrow: string
  summary: string
}> = [
  {
    sort: 'priority',
    label: 'Most urgent',
    eyebrow: 'Urgency',
    summary: 'Pinned, urgent, and deadline-sensitive notices first',
  },
  {
    sort: 'issued',
    label: 'Latest first',
    eyebrow: 'Newest',
    summary: 'Most recently published notices at the top',
  },
  {
    sort: 'closing',
    label: 'Closing soon',
    eyebrow: 'Deadline',
    summary: 'Nearest active deadlines at the top',
  },
]

export const BOARD_SECTION_META: Record<
  BoardSectionId,
  {
    label: string
    summary: string
  }
> = {
  daily: {
    label: 'New today',
    summary: 'Fresh notices published today for quick campus scanning.',
  },
  closing: {
    label: 'Closing soon',
    summary: 'Deadlines and registrations that need attention first.',
  },
  future: {
    label: 'Plan ahead',
    summary: 'Upcoming opportunities with more time to plan.',
  },
  campus: {
    label: 'General notices',
    summary: 'General notices that remain useful but are not deadline-led.',
  },
}

export function normalizeBoardSort(value?: string): BoardSort {
  return BOARD_SORTS.includes(value as BoardSort) ? (value as BoardSort) : 'priority'
}

function normalizeBoardPage(value?: string | number | null) {
  const parsedPage = typeof value === 'number' ? value : Number.parseInt(value ?? '1', 10)
  return Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1
}

function toValidCampusDate(date: CampusDateInput) {
  if (date === null || date === undefined) return null
  const value = date instanceof Date ? date : new Date(date)
  return Number.isNaN(value.getTime()) ? null : value
}

export function formatCampusDate(
  date: CampusDateInput,
  format: CampusDateFormat = 'short',
  fallback = 'Pending'
) {
  const value = toValidCampusDate(date)
  return value ? CAMPUS_DATE_FORMATTERS[format].format(value) : fallback
}

export function formatCampusCompactDate(date: CampusDateInput, fallback = 'Pending') {
  return formatCampusDate(date, 'compact', fallback)
}

export function formatCampusShortDate(date: CampusDateInput, fallback = 'Pending') {
  return formatCampusDate(date, 'short', fallback)
}

export function formatCampusLongDate(date: CampusDateInput = Date.now(), fallback = 'Pending') {
  return formatCampusDate(date, 'long', fallback)
}

export function formatCampusDayDate(date: CampusDateInput, fallback = 'Pending') {
  return formatCampusDate(date, 'dayShort', fallback)
}

export function formatCampusDateTime(date: CampusDateInput, fallback = 'Pending') {
  return formatCampusDate(date, 'dateTime', fallback)
}

export function dateValue(iso?: string | null) {
  if (!iso) return 0
  const value = new Date(iso).getTime()
  return Number.isNaN(value) ? 0 : value
}

function campusDayValue(date: Date | number) {
  const parts = CAMPUS_DAY_FORMATTER.formatToParts(new Date(date))

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day))
}

export function daysUntilDeadline(iso?: string | null, now = Date.now()) {
  if (!iso) return null

  const deadline = dateValue(iso)
  if (deadline <= now) return null

  const dayDiff = Math.round((campusDayValue(deadline) - campusDayValue(now)) / 86_400_000)
  return dayDiff >= 0 ? dayDiff : null
}

export function deadlineLabel(iso?: string | null, now = Date.now()) {
  const days = daysUntilDeadline(iso, now)
  if (!iso || days === null) return 'No deadline'
  if (days === 0) return 'Closes today'
  if (days === 1) return '1 day left'
  if (days <= 14) return `${days} days left`
  return formatCampusShortDate(iso, 'No deadline')
}

function futureDeadlineValue(iso?: string | null, now = Date.now()) {
  const value = dateValue(iso)
  return value > now ? value : Number.POSITIVE_INFINITY
}

function closingRank(announcement: PublicBoardSortable, now = Date.now()) {
  const days = daysUntilDeadline(announcement.expires_at, now)
  if (days === null) return 0
  if (days <= 3) return 3
  if (days <= 7) return 2
  if (days <= 14) return 1
  return 0
}

export function sortAnnouncementsForPublicBoard<T extends PublicBoardSortable>(
  announcements: T[],
  sort: BoardSort,
  now = Date.now()
) {
  return announcements.toSorted((a, b) => {
    if (sort === 'issued') {
      return dateValue(b.published_at) - dateValue(a.published_at)
    }

    if (sort === 'closing') {
      const deadlineDiff =
        futureDeadlineValue(a.expires_at, now) - futureDeadlineValue(b.expires_at, now)
      if (deadlineDiff !== 0) return deadlineDiff

      const urgencyDiff =
        URGENCY_META[normalizeAnnouncementUrgency(b.urgency)].rank -
        URGENCY_META[normalizeAnnouncementUrgency(a.urgency)].rank
      if (urgencyDiff !== 0) return urgencyDiff

      return dateValue(b.published_at) - dateValue(a.published_at)
    }

    const pinnedDiff = Number(isAnnouncementPinned(b, now)) - Number(isAnnouncementPinned(a, now))
    if (pinnedDiff !== 0) return pinnedDiff

    const urgencyDiff =
      URGENCY_META[normalizeAnnouncementUrgency(b.urgency)].rank -
      URGENCY_META[normalizeAnnouncementUrgency(a.urgency)].rank
    if (urgencyDiff !== 0) return urgencyDiff

    const closingDiff = closingRank(b, now) - closingRank(a, now)
    if (closingDiff !== 0) return closingDiff

    return dateValue(b.published_at) - dateValue(a.published_at)
  })
}

export function paginatePublicBoardItems<T extends PublicAnnouncement>(
  announcements: T[],
  {
    sort,
    page,
    pageSize,
    now = Date.now(),
  }: {
    sort: BoardSort
    page?: string | number | null
    pageSize: number
    now?: number
  }
) {
  const sorted = sortAnnouncementsForPublicBoard(announcements, sort, now)
  const total = sorted.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(normalizeBoardPage(page), totalPages)
  const from = (currentPage - 1) * pageSize

  return {
    items: sorted.slice(from, from + pageSize),
    total,
    page: currentPage,
    pageSize,
    totalPages,
  }
}

export function selectPublicBoardHighlights(
  announcements: PublicAnnouncement[],
  now = Date.now(),
  pinnedLimit = 3
) {
  const featured =
    announcements.find(
      (announcement) => announcement.banner_url && !isAnnouncementPinned(announcement, now)
    ) ??
    announcements.find((announcement) => !isAnnouncementPinned(announcement, now)) ??
    announcements[0]
  const featuredIsPinned = featured ? isAnnouncementPinned(featured, now) : false
  const pinnedFeatures = announcements
    .filter(
      (announcement) => isAnnouncementPinned(announcement, now) && announcement.id !== featured?.id
    )
    .slice(0, pinnedLimit)
  const pinnedFeatureIds = new Set(pinnedFeatures.map((announcement) => announcement.id))
  const rest = announcements.filter(
    (announcement) => announcement.id !== featured?.id && !pinnedFeatureIds.has(announcement.id)
  )

  return { featured, featuredIsPinned, pinnedFeatures, rest }
}

export function boardSectionOrder(sort: BoardSort): BoardSectionId[] {
  if (sort === 'closing') return ['closing', 'daily', 'future', 'campus']
  if (sort === 'issued') return ['daily', 'future', 'closing', 'campus']
  return ['daily', 'closing', 'future', 'campus']
}

export function isIssuedToday(iso?: string | null, now = Date.now()) {
  if (!iso) return false
  const value = dateValue(iso)
  if (!value) return false
  return campusDayValue(value) === campusDayValue(now)
}

export function isClosingSoonForBoard(iso?: string | null, now = Date.now()) {
  const days = daysUntilDeadline(iso, now)
  return days !== null && days <= 7
}

export function isFutureEventForBoard(iso?: string | null, now = Date.now()) {
  const days = daysUntilDeadline(iso, now)
  return days !== null && days > 7
}

function announcementMatchesSection(
  announcement: PublicAnnouncement,
  sectionId: BoardSectionId,
  now: number
) {
  if (sectionId === 'daily') return isIssuedToday(announcement.published_at, now)
  if (sectionId === 'closing') return isClosingSoonForBoard(announcement.expires_at, now)
  if (sectionId === 'future') return isFutureEventForBoard(announcement.expires_at, now)
  return true
}

export function buildAnnouncementSections(
  announcements: PublicAnnouncement[],
  sort: BoardSort,
  now = Date.now()
) {
  const order = boardSectionOrder(sort)
  const sections = new Map<BoardSectionId, PublicAnnouncement[]>(order.map((id) => [id, []]))

  announcements.forEach((announcement) => {
    const sectionId = order.find((id) => announcementMatchesSection(announcement, id, now))!
    sections.get(sectionId)!.push(announcement)
  })

  return order.map((id) => ({
    id,
    ...BOARD_SECTION_META[id],
    items: sections.get(id) ?? [],
  }))
}
