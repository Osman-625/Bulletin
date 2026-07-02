import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

function source(path: string) {
  return readFileSync(path, 'utf8')
}

describe('announcement write action error hardening source guards', () => {
  it('keeps new announcement insert failures server-side', () => {
    const actions = source('src/app/(dashboard)/dashboard/announcements/new/actions.ts')

    expect(actions).toContain("from '@/shared/errors/error-reporting'")
    expect(actions).toContain('ANNOUNCEMENT_SAVE_ERROR')
    expect(actions).toContain('ANNOUNCEMENT_SUBMIT_ERROR')
    expect(actions).toContain('reportServerError(')
    expect(actions).not.toContain('throw new Error(error.message)')
  })

  it('keeps edit, publish, submit, and delete failures server-side', () => {
    const actions = source('src/app/(dashboard)/dashboard/announcements/[id]/edit/actions.ts')

    expect(actions).toContain("from '@/shared/errors/error-reporting'")
    expect(actions).toContain('ANNOUNCEMENT_LOAD_ERROR')
    expect(actions).toContain('ANNOUNCEMENT_SAVE_ERROR')
    expect(actions).toContain('ANNOUNCEMENT_PUBLISH_ERROR')
    expect(actions).toContain('ANNOUNCEMENT_UNPUBLISH_ERROR')
    expect(actions).toContain('ANNOUNCEMENT_SUBMIT_ERROR')
    expect(actions).toContain('ANNOUNCEMENT_DELETE_ERROR')
    expect(actions).toContain('announcementReadError')
    expect(actions).toContain('bannerRemoveError')
    expect(actions).toContain('reportServerError(')
    expect(actions).not.toContain('throw new Error(error.message)')
  })
})
