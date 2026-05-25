import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

function source(path: string) {
  return readFileSync(path, 'utf8')
}

describe('workflow source guards', () => {
  it('covers the full publisher submit to admin approval to public feed journey', () => {
    const spec = source('tests/e2e/publisher-workflow.spec.ts')
    const helpers = source('tests/e2e/helpers/admin.ts')

    expect(spec).toContain("loginAs(publisherPage, 'publisher')")
    expect(spec).toContain("loginAs(adminPage, 'admin')")
    expect(spec).toContain('/dashboard/announcements/new')
    expect(spec).toContain(`/admin/review/`)
    expect(spec).toContain('approve and publish')
    expect(spec).toContain('deleteAnnouncementsByTitle')
    expect(helpers).toContain('export async function deleteAnnouncementsByTitle')
    expect(helpers).toContain('export async function getAnnouncementByTitle')
  })
})
