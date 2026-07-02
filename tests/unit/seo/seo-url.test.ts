import { describe, expect, it } from 'vitest'
import {
  announcementLookupId,
  announcementPath,
  announcementPathSegment,
} from '@/modules/announcements/urls'
import { getCanonicalSiteUrl } from '@/shared/constants/site'

const uuid = '123e4567-e89b-12d3-a456-426614174000'

describe('announcement semantic URLs', () => {
  it('builds shareable announcement paths with a readable slug before the lookup id', () => {
    expect(announcementPath({ id: uuid, title: 'Exam Timetable and Yoga Week!' })).toBe(
      `/announcements/exam-timetable-and-yoga-week-${uuid}`
    )
    expect(announcementPathSegment({ id: uuid, title: 'Exam Timetable and Yoga Week!' })).not.toBe(
      uuid
    )
  })

  it('extracts the UUID lookup id from both semantic and legacy raw URL segments', () => {
    expect(announcementLookupId(`exam-timetable-and-yoga-week-${uuid}`)).toBe(uuid)
    expect(announcementLookupId(uuid)).toBe(uuid)
  })
})

describe('canonical site URL', () => {
  it('does not allow localhost to leak into production metadata routes', () => {
    expect(getCanonicalSiteUrl('http://localhost:3000')).toBe('https://bulletininti.vercel.app')
    expect(getCanonicalSiteUrl('https://bulletin.example.com/')).toBe(
      'https://bulletin.example.com'
    )
  })
})
