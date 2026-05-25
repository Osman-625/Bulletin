import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

function source(path: string) {
  return readFileSync(path, 'utf8')
}

describe('publisher image upload E2E source guard', () => {
  it('covers banner upload, storage URL persistence, and public rendering', () => {
    const workflow = source('tests/e2e/publisher-workflow.spec.ts')
    const adminHelpers = source('tests/e2e/helpers/admin.ts')

    expect(workflow).toContain('setInputFiles')
    expect(workflow).toContain('banner-image-upload')
    expect(workflow).toContain('Banner preview')
    expect(workflow).toContain('banner_url')
    expect(workflow).toContain('/storage/v1/object/public/banner-images/')
    expect(workflow).toContain("getByRole('img'")
    expect(adminHelpers).toContain('id, title, status, published_at, banner_url')
  })
})
