import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const structuredServerLogFiles = [
  'src/modules/audit/index.ts',
  'src/infrastructure/database/data.ts',
  'src/modules/notifications/index.ts',
  'src/modules/auth/sync-users.ts',
  'src/modules/owner/resources.ts',
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

      expect(file, path).toContain("from '@/shared/errors/error-reporting'")
      expect(file, path).toContain('reportServerError(')
      expect(file, path).not.toContain('console.error')
    }
  })

  it('logs failed audit writes without swallowing the diagnostic shape', () => {
    const audit = source('src/modules/audit/index.ts')

    expect(audit).toContain('audit.write_failed')
    expect(audit).toContain('audit.write_unhandled')
    expect(audit).toContain('action,')
    expect(audit).toContain('targetType,')
    expect(audit).toContain('targetId,')
  })

  it('logs owner external resource API failures without exposing bearer tokens', () => {
    const resources = source('src/modules/owner/resources.ts')

    expect(resources).toContain('owner.resources.announcements_query_failed')
    expect(resources).toContain('owner.resources.password_resets_count_failed')
    expect(resources).toContain('owner.resources.banner_storage_list_failed')
    expect(resources).toContain('owner.resources.external_api_failed')
    expect(resources).toContain('owner.resources.external_api_unhandled')
    expect(resources).toContain("import { unstable_rethrow } from 'next/navigation'")
    expect(resources).toContain('unstable_rethrow(error)')
    expect(resources).toContain('hostname: url.hostname')
    expect(resources).toContain('pathname: url.pathname')
    expect(resources).not.toContain('Authorization: `Bearer ${token}`')
  })

  it('uses valid external health endpoints and labels owner resource API failures', () => {
    const resources = source('src/modules/owner/resources.ts')

    expect(resources).toContain("['auth', 'db', 'rest', 'realtime', 'storage']")
    expect(resources).not.toContain("'postgres'")
    expect(resources).toContain('usage.api-counts')
    expect(resources).not.toContain('usage.api-requests-count')
    expect(resources).toContain("'Vercel deployments'")
    expect(resources).toContain("'Supabase health check'")
    expect(resources).toContain("'Supabase API usage'")
    expect(resources).toContain('label: context.label')
    expect(resources).toContain('`${context.label} returned ${response.status}.')
    expect(resources).toContain('reportServerWarning(')
    expect(resources).not.toContain('new Error(`External API returned ${response.status}`)')
    expect(resources).toContain('SUPABASE_PROJECT_REF_PATTERN')
    expect(resources).toContain('20-character project ref')
  })
})
