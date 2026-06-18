import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

function source(path: string) {
  return readFileSync(path, 'utf8')
}

describe('client error reporting source guards', () => {
  it('reports publisher form client-side save, submit, delete, and upload failures', () => {
    const form = source('src/components/dashboard/AnnouncementForm.tsx')

    expect(form).toContain("from '@/shared/errors/client-error-reporting'")
    expect(form).toContain("reportClientError('announcement_form.save'")
    expect(form).toContain("reportClientError('announcement_form.submit'")
    expect(form).toContain("reportClientError('announcement_form.delete'")
    expect(form).toContain("reportClientError('announcement_form.banner_upload'")
  })

  it('reports route error boundaries through the shared client reporter', () => {
    const boundaries = [
      ['src/app/(auth)/error.tsx', 'auth.error_boundary'],
      ['src/app/(dashboard)/error.tsx', 'dashboard.error_boundary'],
      ['src/app/(public)/error.tsx', 'public.error_boundary'],
    ] as const

    for (const [path, context] of boundaries) {
      const boundary = source(path)

      expect(boundary, path).toContain("from '@/shared/errors/client-error-reporting'")
      expect(boundary, path).toContain(`reportClientError('${context}'`)
      expect(boundary, path).toContain('digest: error.digest ?? null')
      expect(boundary, path).not.toContain('console.error')
    }
  })
})
