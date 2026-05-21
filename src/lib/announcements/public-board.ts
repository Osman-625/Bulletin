import type { AnnouncementWithRelations } from '@/lib/types'
import {
  URGENCY_META,
  isAnnouncementPinned,
  normalizeAnnouncementUrgency,
} from '@/lib/announcements/presentation'

export const CAMPUS_TIME_ZONE = 'Asia/Kuala_Lumpur'
export const BOARD_SORTS = ['priority', 'issued', 'closing'] as const

export type BoardSort = (typeof BOARD_SORTS)[number]
export type BoardSectionId = 'daily' | 'closing' | 'future' | 'campus'

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

export function formatCampusLongDate(date: Date | number = new Date()) {
  return new Date(date).toLocaleDateString('en-MY', {
    timeZone: CAMPUS_TIME_ZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function dateValue(iso?: string | null) {
  if (!iso) return 0
  const value = new Date(iso).getTime()
  return Number.isNaN(value) ? 0 : value
}

function campusDayValue(date: Date | number) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: CAMPUS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(date))

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
  return new Date(iso).toLocaleDateString('en-MY', {
    timeZone: CAMPUS_TIME_ZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function futureDeadlineValue(iso?: string | null, now = Date.now()) {
  const value = dateValue(iso)
  return value > now ? value : Number.POSITIVE_INFINITY
}

function closingRank(announcement: AnnouncementWithRelations, now = Date.now()) {
  const days = daysUntilDeadline(announcement.expires_at, now)
  if (days === null) return 0
  if (days <= 3) return 3
  if (days <= 7) return 2
  if (days <= 14) return 1
  return 0
}

export function sortAnnouncementsForPublicBoard(
  announcements: AnnouncementWithRelations[],
  sort: BoardSort,
  now = Date.now()
) {
  return [...announcements].sort((a, b) => {
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

export function boardSectionOrder(sort: BoardSort): BoardSectionId[] {
  if (sort === 'closing') return ['closing', 'daily', 'future', 'campus']
  if (sort === 'issued') return ['daily', 'future', 'closing', 'campus']
  return ['daily', 'closing', 'future', 'campus']
}

function isIssuedToday(iso?: string | null, now = Date.now()) {
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
  announcement: AnnouncementWithRelations,
  sectionId: BoardSectionId,
  now: number
) {
  if (sectionId === 'daily') return isIssuedToday(announcement.published_at, now)
  if (sectionId === 'closing') return isClosingSoonForBoard(announcement.expires_at, now)
  if (sectionId === 'future') return isFutureEventForBoard(announcement.expires_at, now)
  return true
}

export function buildAnnouncementSections(
  announcements: AnnouncementWithRelations[],
  sort: BoardSort,
  now = Date.now()
) {
  const order = boardSectionOrder(sort)
  const sections = new Map<BoardSectionId, AnnouncementWithRelations[]>(order.map((id) => [id, []]))

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
