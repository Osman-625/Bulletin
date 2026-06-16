import { readFileSync } from 'node:fs'
import { describe, expect, it, beforeEach } from 'vitest'
import {
  ANNOUNCEMENT_BODY_MAX,
  ANNOUNCEMENT_TITLE_MAX,
  assertAnnouncementReadyForReview,
  readAnnouncementTextFields,
  readOptionalBannerUrl,
  readOptionalHttpUrl,
  readAnnouncementScheduleFields,
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

  it('accepts owned Supabase banner URLs when actor and organization checks are supplied', () => {
    const url =
      'https://example-project.supabase.co/storage/v1/object/public/banner-images/user-1/org-1/announcement.png'

    expect(
      readOptionalBannerUrl(formData('banner_url', url), 'banner_url', {
        userId: 'user-1',
        organizationId: 'org-1',
      })
    ).toBe(url)
  })

  it('rejects Supabase banner URLs for a different actor or organization when scoped', () => {
    const url =
      'https://example-project.supabase.co/storage/v1/object/public/banner-images/user-2/org-1/announcement.png'

    expect(() =>
      readOptionalBannerUrl(formData('banner_url', url), 'banner_url', {
        userId: 'user-1',
        organizationId: 'org-1',
      })
    ).toThrow('Banner image must be uploaded by your account for this organization.')
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

  it('validates schedule, pin, and expiry windows together', () => {
    const form = new FormData()
    form.set('scheduled_publish_at', '2026-06-20T02:00:00.000Z')
    form.set('expires_at', '2026-06-19T02:00:00.000Z')

    expect(() =>
      readAnnouncementScheduleFields(form, { now: Date.parse('2026-06-15T00:00:00.000Z') })
    ).toThrow('Expiration date must be after the scheduled publish time.')

    const pinForm = new FormData()
    pinForm.set('pinned_until', '2026-06-21T02:00:00.000Z')
    pinForm.set('expires_at', '2026-06-20T02:00:00.000Z')

    expect(() =>
      readAnnouncementScheduleFields(pinForm, { now: Date.parse('2026-06-15T00:00:00.000Z') })
    ).toThrow('Pinned until must not be after the expiration date.')
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

  it('keeps banner upload limits in shared announcement form config', () => {
    const helperSource = source('src/lib/announcements/form.ts')
    const formSource = source('src/components/dashboard/AnnouncementForm.tsx')

    expect(helperSource).toContain('BANNER_MAX_FILE_SIZE_MB = 5')
    expect(helperSource).toContain(
      'BANNER_MAX_FILE_SIZE_BYTES = BANNER_MAX_FILE_SIZE_MB * 1024 * 1024'
    )
    expect(formSource).toContain('BANNER_MAX_FILE_SIZE_BYTES')
    expect(formSource).toContain('BANNER_MAX_FILE_SIZE_MB')
    expect(formSource).not.toContain('const BANNER_MAX_FILE_SIZE = 5 * 1024 * 1024')
    expect(formSource).not.toContain('max 5MB')
    expect(formSource).not.toContain('File exceeds 5 MB limit')
  })
})
