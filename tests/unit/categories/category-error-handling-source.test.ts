import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const categoryPages = [
  'src/app/(admin)/admin/categories/page.tsx',
  'src/app/(super-admin)/super-admin/categories/page.tsx',
  'src/app/(owner)/owner/categories/page.tsx',
]

function source(path: string) {
  return readFileSync(path, 'utf8')
}

describe('category write error handling source guards', () => {
  it.each(categoryPages)('%s reports Supabase failures and redirects with safe copy', (path) => {
    const page = source(path)

    expect(page).toContain("from '@/shared/errors/error-reporting'")
    expect(page).toContain('reportServerError(')
    expect(page).toContain('CATEGORY_SAVE_ERROR')
    expect(page).toContain('CATEGORY_DELETE_ERROR')
    expect(page).not.toContain('encodeURIComponent(error.message)')
  })

  it('does not silently ignore category toggle or delete write failures', () => {
    const pages = categoryPages.map(source).join('\n')

    expect(pages).toContain('toggleError')
    expect(pages).toContain('deleteError')
    expect(pages).toContain('announcementUpdateError')
  })
})
