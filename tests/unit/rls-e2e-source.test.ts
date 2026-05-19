import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

function source(path: string) {
  return readFileSync(path, 'utf8')
}

describe('RLS and storage isolation E2E source guards', () => {
  it('covers cross-organization announcement isolation with real Supabase clients', () => {
    const spec = source('tests/e2e/rls-isolation.spec.ts')

    expect(spec).toContain("test.describe('Supabase RLS isolation'")
    expect(spec).toContain('createPublisherFixture')
    expect(spec).toContain('cannot read another organization draft announcement')
    expect(spec).toContain('cannot update another organization announcement')
    expect(spec).toContain('getServiceAnnouncement')
  })

  it('covers banner storage namespace isolation with authenticated clients', () => {
    const spec = source('tests/e2e/rls-isolation.spec.ts')

    expect(spec).toContain('banner-images')
    expect(spec).toContain('ownStoragePath')
    expect(spec).toContain('crossOrgStoragePath')
    expect(spec).toContain('cannot upload into another organization banner namespace')
    expect(spec).toContain('cleanupRlsFixture')
  })
})
