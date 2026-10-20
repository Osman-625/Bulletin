import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

function source(path: string) {
  return readFileSync(path, 'utf8')
}

describe('category write error handling source guards', () => {
  const management = source('src/modules/categories/management.ts')

  it('reports Supabase failures and redirects with safe copy', () => {
    expect(management).toContain("from '@/shared/errors/error-reporting'")
    expect(management).toContain('reportServerError(')
    expect(management).toContain('CATEGORY_SAVE_ERROR')
    expect(management).toContain('CATEGORY_DELETE_ERROR')
    expect(management).not.toContain('encodeURIComponent(error.message)')
  })

  it('does not silently ignore category toggle or delete write failures', () => {
    expect(management).toContain('toggleError')
    expect(management).toContain('deleteError')
    expect(management).toContain('announcementUpdateError')
  })
})
