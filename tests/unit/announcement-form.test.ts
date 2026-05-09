import { describe, expect, it, beforeEach } from 'vitest'
import { readOptionalBannerUrl, readOptionalHttpUrl } from '@/lib/announcements/form'
import { toSafeHttpUrl } from '@/lib/announcements/urls'

function formData(key: string, value: string): FormData {
  const form = new FormData()
  form.set(key, value)
  return form
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
})
