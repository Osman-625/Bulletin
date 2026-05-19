import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const structuredServerLogFiles = [
  'src/lib/audit.ts',
  'src/lib/data.ts',
  'src/lib/notifications.ts',
  'src/lib/auth/sync-users.ts',
  'src/app/sitemap.ts',
  'src/app/(public)/announcements/[id]/actions.ts',
] as const

function source(path: string) {
  return readFileSync(path, 'utf8')
}

describe('structured server logging source guards', () => {
  it('uses the shared server error reporter in Supabase-backed helpers', () => {
    for (const path of structuredServerLogFiles) {
      const file = source(path)

      expect(file, path).toContain("from '@/lib/error-reporting'")
      expect(file, path).toContain('reportServerError(')
      expect(file, path).not.toContain('console.error')
    }
  })

  it('logs failed audit writes without swallowing the diagnostic shape', () => {
    const audit = source('src/lib/audit.ts')

    expect(audit).toContain('audit.write_failed')
    expect(audit).toContain('audit.write_unhandled')
    expect(audit).toContain('action,')
    expect(audit).toContain('targetType,')
    expect(audit).toContain('targetId,')
  })
})
