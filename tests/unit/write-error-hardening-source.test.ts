import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

function source(path: string) {
  return readFileSync(path, 'utf8')
}

describe('write route error hardening source guards', () => {
  it('keeps admin organization creation database errors server-side', () => {
    const actions = source('src/app/(admin)/admin/orgs/new/actions.ts')

    expect(actions).toContain("from '@/lib/error-reporting'")
    expect(actions).toContain('ORGANIZATION_CREATE_ERROR')
    expect(actions).toContain('reportServerError(')
    expect(actions).not.toContain('error.message')
  })

  it('returns safe review feedback instead of throwing backend errors', () => {
    const actions = source('src/app/(admin)/admin/review/[id]/actions.ts')
    const page = source('src/app/(admin)/admin/review/[id]/page.tsx')

    expect(actions).toContain("from '@/lib/error-reporting'")
    expect(actions).toContain('REVIEW_WRITE_ERROR')
    expect(actions).toContain('reportServerError(')
    expect(actions).toContain('review_failed')
    expect(page).toContain("error === 'review_failed'")
    expect(actions).not.toContain('throw new Error(error.message)')
    expect(actions).not.toContain('reviewError.message')
  })

  it('handles setup write failures without exposing auth provider messages', () => {
    const route = source('src/app/api/setup/route.ts')

    expect(route).toContain("from '@/lib/error-reporting'")
    expect(route).toContain('SETUP_WRITE_ERROR')
    expect(route).toContain('reportServerError(')
    expect(route).toContain('ownerReadError')
    expect(route).toContain('existingUserReadError')
    expect(route).toContain('existingAuthUpdateError')
    expect(route).toContain('existingProfileUpdateError')
    expect(route).toContain('authCreateError')
    expect(route).toContain('createdProfileUpdateError')
    expect(route).not.toContain('authError?.message')
  })
})
