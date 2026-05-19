import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

function source(path: string) {
  return readFileSync(path, 'utf8')
}

describe('security source guards', () => {
  it('marks Supabase service-role modules as server-only', () => {
    expect(source('src/lib/supabase/admin.ts')).toContain("import 'server-only'")
    expect(source('src/lib/supabase/server.ts')).toContain("import 'server-only'")
  })

  it('records announcement edit events in the audit log', () => {
    const actions = source('src/app/(dashboard)/dashboard/announcements/[id]/edit/actions.ts')

    expect(actions).toContain("action: 'announcement.updated'")
    expect(actions).toContain('previous_status: announcement.status')
    expect(actions).toContain('organization_id: announcement.organizationId')
  })

  it('ships a migration that hardens audit-log writes and common announcement indexes', () => {
    const migration = source('supabase/migrations/20260518000015_security_hardening.sql')

    expect(migration).toContain('drop policy if exists "audit_log: service insert"')
    expect(migration).toContain(
      'revoke insert, update, delete on public.audit_log from anon, authenticated'
    )
    expect(migration).toContain('idx_organization_members_user')
    expect(migration).toContain('idx_announcements_public_feed')
  })

  it('authorizes admin organization creation inside the server action before inserting', () => {
    const actions = source('src/app/(admin)/admin/orgs/new/actions.ts')
    const accessCheckIndex = actions.indexOf('getCurrentAccessContext')
    const roleCheckIndex = actions.indexOf('canAccessAdminArea')
    const validationIndex = actions.indexOf('readOrganizationFormData')
    const insertIndex = actions.indexOf(".from('organizations')")

    expect(actions).toContain("from '@/lib/auth/authz'")
    expect(actions).toContain("from '@/lib/organizations/validation'")
    expect(accessCheckIndex).toBeGreaterThan(-1)
    expect(roleCheckIndex).toBeGreaterThan(-1)
    expect(validationIndex).toBeGreaterThan(-1)
    expect(insertIndex).toBeGreaterThan(-1)
    expect(accessCheckIndex).toBeLessThan(insertIndex)
    expect(roleCheckIndex).toBeLessThan(insertIndex)
    expect(validationIndex).toBeLessThan(insertIndex)
  })

  it('ships a storage policy migration that scopes banner uploads to the actor and organization', () => {
    const migration = source('supabase/migrations/20260519000016_storage_policy_hardening.sql')

    expect(migration).toContain('drop policy if exists "banners: publisher upload"')
    expect(migration).toContain('create policy "banners: publisher upload"')
    expect(migration).toContain('auth.uid()::text = (storage.foldername(name))[1]')
    expect(migration).toContain('organization_members')
    expect(migration).toContain('organization_id::text = (storage.foldername(name))[2]')
    expect(migration).toContain("public.current_user_role() in ('admin', 'super_admin', 'owner')")
  })

  it('ships a storage policy migration that keeps banner upserts and deletes scoped', () => {
    const migration = source(
      'supabase/migrations/20260519000017_storage_upsert_policy_hardening.sql'
    )

    expect(migration).toContain('drop policy if exists "banners: owner manage"')
    expect(migration).toContain('drop policy if exists "banners: owner delete"')
    expect(migration).toContain('create policy "banners: owner manage"')
    expect(migration).toContain('for update')
    expect(migration).toContain('with check')
    expect(migration).toContain('create policy "banners: owner delete"')
    expect(migration).toContain('auth.uid()::text = (storage.foldername(name))[1]')
    expect(migration).toContain('organization_members')
    expect(migration).toContain('organization_id::text = (storage.foldername(name))[2]')
    expect(migration).toContain("public.current_user_role() in ('admin', 'super_admin', 'owner')")
  })

  it('sets browser hardening headers beyond the basic defaults', () => {
    const config = source('next.config.ts')

    expect(config).toContain('Content-Security-Policy')
    expect(config).toContain('Strict-Transport-Security')
    expect(config).toContain('Permissions-Policy')
    expect(config).toContain('Cross-Origin-Opener-Policy')
  })
})
