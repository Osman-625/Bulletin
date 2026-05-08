import { describe, expect, it } from 'vitest'
import { isAnnouncementPinned, sortAnnouncementsForFeed } from '@/lib/announcements/presentation'

describe('announcement presentation helpers', () => {
  it('treats pinned announcements as active only before pinned_until', () => {
    expect(isAnnouncementPinned({ pinned_until: new Date(Date.now() + 60_000).toISOString() })).toBe(true)
    expect(isAnnouncementPinned({ pinned_until: new Date(Date.now() - 60_000).toISOString() })).toBe(false)
    expect(isAnnouncementPinned({ pinned_until: null })).toBe(false)
  })

  it('sorts pinned announcements before urgent and recent posts', () => {
    const sorted = sortAnnouncementsForFeed([
      {
        id: 'urgent',
        urgency: 'urgent',
        published_at: new Date(Date.now()).toISOString(),
        pinned_until: null,
      },
      {
        id: 'pinned',
        urgency: 'normal',
        published_at: new Date(Date.now() - 86_400_000).toISOString(),
        pinned_until: new Date(Date.now() + 86_400_000).toISOString(),
      },
    ])

    expect(sorted[0].id).toBe('pinned')
  })
})
