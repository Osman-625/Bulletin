import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const userWriteFiles = [
  'src/app/(owner)/owner/users/page.tsx',
  'src/app/(super-admin)/super-admin/users/page.tsx',
  'src/app/(admin)/admin/users/page.tsx',
  'src/app/(super-admin)/super-admin/users/actions.ts',
]

function source(path: string) {
  return readFileSync(path, 'utf8')
}

describe('user write error handling source guards', () => {
  it.each(userWriteFiles)('%s logs write failures and keeps backend errors private', (path) => {
    const file = source(path)

    expect(file).toContain("from '@/lib/error-reporting'")
    expect(file).toContain('reportServerError(')
    expect(file).not.toContain('encodeURIComponent(error?.message')
    expect(file).not.toContain('encodeURIComponent(authError.message')
    expect(file).not.toContain('return { error: authError.message }')
  })

  it('does not silently ignore high-risk user write failures', () => {
    const pages = userWriteFiles.map(source).join('\n')

    expect(pages).toContain('profileUpsertError')
    expect(pages).toContain('roleUpdateError')
    expect(pages).toContain('authUpdateError')
    expect(pages).toContain('profileUpdateError')
    expect(pages).toContain('authDeleteError')
    expect(pages).toContain('requestUpdateError')
  })
})
