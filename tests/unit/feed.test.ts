import { describe, it, expect } from 'vitest'
import { matchesSearch } from '@/lib/announcements/feed'
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
