import { describe, it, expect } from 'vitest'
import { derivePublicTopics, matchesSearch } from '@/lib/announcements/feed'
import type { AnnouncementWithRelations } from '@/lib/types'

function announcement(overrides: Partial<AnnouncementWithRelations> = {}): AnnouncementWithRelations {
  return {
    id: 'a1',
    title: 'Exam Schedule Released',
    body: 'Final exams begin on 15 June 2026.',
    status: 'approved',
    is_pinned: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    published_at: new Date().toISOString(),
    expires_at: null,
    category_id: 'cat-1',
    organization_id: 'org-1',
    author_id: 'user-1',
    categories: { id: 'cat-1', name: 'Academic', slug: 'academic', color: '#000' },
    organizations: { id: 'org-1', name: 'Student Affairs', slug: 'student-affairs', logo_url: null },
    ...overrides,
  } as AnnouncementWithRelations
}

describe('matchesSearch', () => {
  it('returns true when query is empty string', () => {
    expect(matchesSearch(announcement(), '')).toBe(true)
  })

  it('matches title (case-insensitive)', () => {
    expect(matchesSearch(announcement(), 'exam')).toBe(true)
    expect(matchesSearch(announcement(), 'EXAM')).toBe(true)
  })

  it('matches body text', () => {
    expect(matchesSearch(announcement(), 'june 2026')).toBe(true)
  })

  it('matches category name', () => {
    expect(matchesSearch(announcement(), 'academic')).toBe(true)
  })

  it('matches organization name', () => {
    expect(matchesSearch(announcement(), 'student affairs')).toBe(true)
  })

  it('returns false when query matches nothing', () => {
    expect(matchesSearch(announcement(), 'xyznotfound')).toBe(false)
  })

  it('handles null categories gracefully', () => {
    const a = announcement({ categories: null })
    expect(matchesSearch(a, 'academic')).toBe(false)
    expect(matchesSearch(a, 'exam')).toBe(true)
  })

  it('handles null organizations gracefully', () => {
    const a = announcement({ organizations: null })
    expect(matchesSearch(a, 'student affairs')).toBe(false)
    expect(matchesSearch(a, 'exam')).toBe(true)
  })

  it('matches partial words', () => {
    expect(matchesSearch(announcement(), 'sched')).toBe(true)
  })

  it('does not match on unrelated partial', () => {
    expect(matchesSearch(announcement(), 'xyz')).toBe(false)
  })
})

describe('derivePublicTopics', () => {
  it('falls back to categories attached to visible announcements', () => {
    const visible = [
      announcement({
        id: 'a1',
        categories: { id: 'cat-1', name: 'Academic', slug: 'academic', color: '#c8102e' },
      }),
      announcement({
        id: 'a2',
        categories: { id: 'cat-2', name: 'Wellbeing', slug: 'wellbeing', color: '#002f6c' },
      }),
      announcement({
        id: 'a3',
        categories: { id: 'cat-1', name: 'Academic', slug: 'academic', color: '#c8102e' },
      }),
    ]

    expect(derivePublicTopics([], visible)).toEqual([
      {
        id: 'cat-1',
        name: 'Academic',
        slug: 'academic',
        color: '#c8102e',
        is_active: true,
        created_at: '',
      },
      {
        id: 'cat-2',
        name: 'Wellbeing',
        slug: 'wellbeing',
        color: '#002f6c',
        is_active: true,
        created_at: '',
      },
    ])
  })

  it('prefers active category records when they are available', () => {
    const activeCategories = [
      {
        id: 'cat-3',
        name: 'Events',
        slug: 'events',
        color: '#e0a01f',
        is_active: true,
        created_at: '2026-05-15T00:00:00.000Z',
      },
    ]

    expect(derivePublicTopics(activeCategories, [announcement()])).toBe(activeCategories)
  })
})
