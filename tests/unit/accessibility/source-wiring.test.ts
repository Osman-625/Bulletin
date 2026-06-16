import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

function source(path: string) {
  return readFileSync(path, 'utf8')
}

function compact(value: string) {
  return value.replace(/\s+/g, ' ')
}

describe('accessibility source wiring', () => {
  it('provides main-content targets for skip links on auth, dashboard, and detail landmarks', () => {
    const routedMainFiles = [
      'src/app/(auth)/login/page.tsx',
      'src/app/(auth)/forgot-password/page.tsx',
      'src/components/dashboard/DashboardShell.tsx',
      'src/app/(public)/announcements/[id]/page.tsx',
      'src/app/(public)/loading.tsx',
      'src/app/brand-lab/BrandLabView.tsx',
      'src/app/global-error.tsx',
      'src/app/not-found.tsx',
    ]

    for (const file of routedMainFiles) {
      expect(source(file), file).toMatch(/<main[\s\S]*?id="main-content"/)
    }
  })

  it('associates announcement registration and banner field errors with their controls', () => {
    const form = source('src/components/dashboard/AnnouncementForm.tsx')

    expect(form).toContain('id="banner-image-upload-error"')
    expect(form).toContain('aria-invalid={bannerSizeError || Boolean(bannerUploadError)}')
    expect(compact(form)).toMatch(
      /aria-describedby=\{\s*bannerSizeError \|\| bannerUploadError \? 'banner-image-upload-error' : undefined\s*\}/
    )
    expect(form).toContain('role="alert"')
    expect(form).toContain('aria-live="polite"')

    expect(form).toContain('id="registration-link-error"')
    expect(form).toContain('aria-invalid={Boolean(urlError)}')
    expect(compact(form)).toContain(
      "aria-describedby={urlError ? 'registration-link-error' : undefined}"
    )
  })
})
