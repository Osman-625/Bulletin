import { readFileSync } from 'node:fs'
import { describe, expect, it, beforeEach } from 'vitest'
import {
  ANNOUNCEMENT_BODY_MAX,
  ANNOUNCEMENT_TITLE_MAX,
  assertAnnouncementReadyForReview,
  readAnnouncementTextFields,
  readOptionalBannerUrl,
  readOptionalHttpUrl,
} from '@/lib/announcements/form'
import { toSafeHttpUrl } from '@/lib/announcements/urls'

function formData(key: string, value: string): FormData {
  const form = new FormData()
  form.set(key, value)
  return form
}

function announcementFormData({ title = '', body = '' }: { title?: string; body?: string }) {
  const form = new FormData()
  form.set('title', title)
  form.set('body', body)
  return form
}

function source(path: string) {
  return readFileSync(path, 'utf8')
}

describe('announcement form validation helpers', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example-project.supabase.co'
  })

  it('accepts trimmed http and https registration links', () => {
    expect(
      readOptionalHttpUrl(
        formData('registration_link', ' https://forms.example.com/a '),
        'registration_link'
      )
    ).toBe('https://forms.example.com/a')
  })

  it('rejects non-http registration links', () => {
    expect(() =>
      readOptionalHttpUrl(
        formData('registration_link', 'javascript:alert(1)'),
        'registration_link',
        'Registration link'
      )
    ).toThrow('Registration link must start with http:// or https://.')
  })

  it('accepts local sample announcement banners', () => {
    expect(
      readOptionalBannerUrl(
        formData('banner_url', '/sample-announcements/orientation.png'),
        'banner_url'
      )
    ).toBe('/sample-announcements/orientation.png')
  })

  it('accepts Supabase banner-images URLs from the configured project', () => {
    const url =
      'https://example-project.supabase.co/storage/v1/object/public/banner-images/announcement.png'

    expect(readOptionalBannerUrl(formData('banner_url', url), 'banner_url')).toBe(url)
  })

  it('rejects banners from the deprecated or wrong bucket', () => {
    const url =
      'https://example-project.supabase.co/storage/v1/object/public/announcement-banners/announcement.png'

    expect(() => readOptionalBannerUrl(formData('banner_url', url), 'banner_url')).toThrow(
      'Banner image must come from the Bulletin banner-images storage bucket.'
    )
  })

  it('normalizes stored http links and suppresses unsafe hrefs', () => {
    expect(toSafeHttpUrl(' https://forms.example.com/a ')).toBe('https://forms.example.com/a')
    expect(toSafeHttpUrl('javascript:alert(1)')).toBeNull()
    expect(toSafeHttpUrl('not-a-url')).toBeNull()
  })

  it('allows incomplete drafts but trims and defaults empty titles', () => {
    expect(
      readAnnouncementTextFields(announcementFormData({ title: '  ', body: ' Draft ' }))
    ).toEqual({
      title: 'Untitled Announcement',
      body: 'Draft',
    })
  })

  it('requires title and body before submitting for review', () => {
    expect(() =>
      readAnnouncementTextFields(announcementFormData({ title: '', body: 'Details' }), {
        requireComplete: true,
      })
    ).toThrow('Add a title before submitting for review.')

    expect(() => assertAnnouncementReadyForReview('Ready title', '   ')).toThrow(
      'Add announcement body before submitting for review.'
    )
  })

  it('rejects announcement text that exceeds server-side limits', () => {
    expect(() =>
      readAnnouncementTextFields(
        announcementFormData({ title: 'x'.repeat(ANNOUNCEMENT_TITLE_MAX + 1), body: 'Body' })
      )
    ).toThrow(`Title must be ${ANNOUNCEMENT_TITLE_MAX} characters or fewer.`)

    expect(() =>
      readAnnouncementTextFields(
        announcementFormData({ title: 'Title', body: 'x'.repeat(ANNOUNCEMENT_BODY_MAX + 1) })
      )
    ).toThrow(`Body must be ${ANNOUNCEMENT_BODY_MAX} characters or fewer.`)
  })

  it('uses unique storage filenames without requesting banner upload upserts', () => {
    const formSource = source('src/components/dashboard/AnnouncementForm.tsx')

    expect(formSource).toContain('crypto.randomUUID()')
    expect(formSource).not.toContain('upsert: true')
  })
})
