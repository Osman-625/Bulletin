import { describe, expect, it } from 'vitest'
import {
  CAMPUS_TIME_ZONE,
  buildAnnouncementSections,
  deadlineLabel,
  formatCampusLongDate,
  normalizeBoardSort,
  sortAnnouncementsForPublicBoard,
} from '@/lib/announcements/public-board'
import type { AnnouncementWithRelations } from '@/lib/types'

function announcement(
  id: string,
  overrides: Partial<AnnouncementWithRelations> = {}
): AnnouncementWithRelations {
  return {
    id,
    title: id,
    body: '',
    status: 'published',
    is_pinned: false,
    created_at: '2026-05-01T00:00:00.000Z',
    updated_at: '2026-05-01T00:00:00.000Z',
    published_at: '2026-05-01T00:00:00.000Z',
    expires_at: null,
    scheduled_publish_at: null,
    pinned_until: null,
    registration_link: null,
    banner_url: null,
    category_id: 'cat-1',
    organization_id: 'org-1',
    author_id: 'user-1',
    urgency: 'normal',
    display_font: 'editorial',
    display_size: 'standard',
    view_count: 0,
    categories: { id: 'cat-1', name: 'Academic', slug: 'academic', color: '#c8102e' },
    organizations: {
      id: 'org-1',
      name: 'Student Affairs',
      slug: 'student-affairs',
      logo_url: null,
    },
    ...overrides,
  } as AnnouncementWithRelations
}

describe('public board helpers', () => {
  const now = Date.parse('2026-05-21T00:30:00+08:00')

  it('uses the Malaysia campus timezone for public dates', () => {
    expect(CAMPUS_TIME_ZONE).toBe('Asia/Kuala_Lumpur')
    expect(formatCampusLongDate(new Date(now))).toBe('Thursday, 21 May 2026')
  })

  it('normalizes unknown sort values to priority', () => {
    expect(normalizeBoardSort('issued')).toBe('issued')
    expect(normalizeBoardSort('closing')).toBe('closing')
    expect(normalizeBoardSort('bad-sort')).toBe('priority')
    expect(normalizeBoardSort(undefined)).toBe('priority')
  })

  it('labels deadlines by days remaining from the campus render time', () => {
    expect(deadlineLabel('2026-05-21T12:00:00+08:00', now)).toBe('Closes today')
    expect(deadlineLabel('2026-05-22T12:00:00+08:00', now)).toBe('1 day left')
    expect(deadlineLabel('2026-05-24T12:00:00+08:00', now)).toBe('3 days left')
    expect(deadlineLabel(null, now)).toBe('No deadline')
  })

  it('sorts priority announcements by pin, urgency, closing rank, then publish date', () => {
    const items = [
      announcement('standard-latest', { published_at: '2026-05-20T00:00:00.000Z' }),
      announcement('urgent', { urgency: 'urgent', published_at: '2026-05-19T00:00:00.000Z' }),
      announcement('pinned', { pinned_until: '2026-05-24T00:00:00.000Z' }),
      announcement('closing', { expires_at: '2026-05-22T00:00:00.000Z' }),
    ]

    expect(sortAnnouncementsForPublicBoard(items, 'priority', now).map((item) => item.id)).toEqual([
      'pinned',
      'urgent',
      'closing',
      'standard-latest',
    ])
  })

  it('builds sections using the campus timezone instead of the server timezone', () => {
    const items = [
      announcement('new-today', { published_at: '2026-05-20T18:00:00.000Z' }),
      announcement('closing-soon', { expires_at: '2026-05-22T00:00:00.000Z' }),
      announcement('future', { expires_at: '2026-06-15T00:00:00.000Z' }),
      announcement('general'),
    ]

    const sections = buildAnnouncementSections(items, 'priority', now)

    expect(sections.map((section) => [section.id, section.items.map((item) => item.id)])).toEqual([
      ['daily', ['new-today']],
      ['closing', ['closing-soon']],
      ['future', ['future']],
      ['campus', ['general']],
    ])
  })
})
