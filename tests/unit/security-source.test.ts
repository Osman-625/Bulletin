import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

function source(path: string) {
  return readFileSync(path, 'utf8')
}

function loggedAuditActions(path: string) {
  return source(path)
    .split('\n')
    .filter((line) => line.includes('action:'))
    .flatMap((line) => [...line.matchAll(/'([a-z]+(?:[._-][a-z]+)+)'/g)].map((match) => match[1]))
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

  it('renders owner audit labels for every action currently written by mutation sources', () => {
    const auditPage = source('src/app/(owner)/owner/audit/page.tsx')
    const actionSources = [
      'src/app/(auth)/login/actions.ts',
      'src/app/(auth)/forgot-password/actions.ts',
      'src/app/change-password/actions.ts',
      'src/app/register/actions.ts',
      'src/app/(dashboard)/dashboard/announcements/new/actions.ts',
      'src/app/(dashboard)/dashboard/announcements/[id]/edit/actions.ts',
      'src/app/(admin)/admin/review/[id]/actions.ts',
      'src/app/(admin)/admin/orgs/new/actions.ts',
      'src/app/(admin)/admin/publishers/invite/actions.ts',
      'src/app/(admin)/admin/users/page.tsx',
      'src/app/(admin)/admin/categories/page.tsx',
      'src/app/(super-admin)/super-admin/admins/invite/actions.ts',
      'src/app/(super-admin)/super-admin/users/page.tsx',
      'src/app/(super-admin)/super-admin/users/actions.ts',
      'src/app/(super-admin)/super-admin/categories/page.tsx',
      'src/app/(owner)/owner/users/page.tsx',
      'src/app/(owner)/owner/categories/page.tsx',
      'src/lib/account/actions.ts',
    ]

    const actions = Array.from(new Set(actionSources.flatMap(loggedAuditActions))).sort()

    expect(actions.length).toBeGreaterThan(20)
    for (const action of actions) {
      expect(auditPage).toContain(`'${action}':`)
    }
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
    const proxy = source('src/proxy.ts')

    expect(proxy).toContain('Content-Security-Policy')
    expect(config).toContain('Strict-Transport-Security')
    expect(config).toContain('Permissions-Policy')
    expect(config).toContain('Cross-Origin-Opener-Policy')
  })

  it('keeps Next 16 request proxy active with force-password-change enforcement', () => {
    const proxy = source('src/proxy.ts')

    expect(existsSync('src/proxy.ts')).toBe(true)
    expect(existsSync('src/middleware.ts')).toBe(false)
    expect(proxy).toContain('export async function proxy(request: NextRequest)')
    expect(proxy).toContain('force_password_change')
    expect(proxy).toContain("url.pathname = '/change-password'")
    expect(proxy).toContain('export const config')
    expect(proxy).toContain('matcher:')
  })

  it('does not ship hardcoded setup credentials or a default setup secret', () => {
    const route = source('src/app/api/setup/route.ts')

    expect(route).not.toContain('test-setup-secret')
    expect(route).not.toContain('DEFAULT_SETUP_OWNER_EMAIL')
    expect(route).not.toContain('DEFAULT_SETUP_OWNER_USERNAME')
    expect(route).not.toContain('osman_owner')
    expect(route).toContain('const secret = process.env.SETUP_SECRET?.trim()')
    expect(route).toContain('if (!secret || request.headers.get')
  })

  it('uses a Supabase-backed server rate limiter for auth and setup throttles', () => {
    const persistentLimiter = source('src/lib/security/persistent-rate-limit.ts')
    const actionLimiter = source('src/lib/security/action-rate-limit.ts')
    const setupRoute = source('src/app/api/setup/route.ts')
    const migration = source('supabase/migrations/20260521000019_rate_limit_buckets.sql')
    const databaseTypes = source('src/lib/database.types.ts')

    expect(persistentLimiter).toContain("import 'server-only'")
    expect(persistentLimiter).toContain("rpc('hit_rate_limit'")
    expect(persistentLimiter).toContain('checkRateLimit(key, options)')
    expect(persistentLimiter).not.toContain('as unknown as HitRateLimitClient')
    expect(actionLimiter).toContain('checkPersistentRateLimit')
    expect(actionLimiter).not.toContain('return checkRateLimit(')
    expect(setupRoute).toContain('await checkPersistentRateLimit')
    expect(migration).toContain('create table if not exists public.rate_limit_buckets')
    expect(migration).toContain('create or replace function public.hit_rate_limit')
    expect(migration).toContain('grant execute on function public.hit_rate_limit')
    expect(databaseTypes).toContain('rate_limit_buckets: {')
    expect(databaseTypes).toContain('hit_rate_limit: {')
  })

  it('keeps unsafe eval out of production CSP while allowing React development diagnostics', () => {
    const config = source('next.config.ts')
    const proxy = source('src/proxy.ts')

    expect(config).not.toContain("'unsafe-eval'")
    expect(proxy).toContain("process.env.NODE_ENV !== 'production'")
    expect(proxy).toContain('allowUnsafeEval')
    expect(proxy).toContain('scriptSrc.push("\'unsafe-eval\'")')
  })

  it('uses a per-request nonce for production script CSP', () => {
    const config = source('next.config.ts')
    const proxy = source('src/proxy.ts')
    const layout = source('src/app/layout.tsx')

    expect(config).not.toContain('Content-Security-Policy')
    expect(proxy).toContain('crypto.randomUUID()')
    expect(proxy).toContain("requestHeaders.set('x-nonce', nonce)")
    expect(proxy).toContain("'nonce-${nonce}'")
    expect(proxy).toContain("'strict-dynamic'")
    expect(proxy).toContain("script-src 'self' 'nonce-${nonce}' 'strict-dynamic'")
    expect(proxy).not.toContain("script-src 'self' 'unsafe-inline'")
    expect(layout).toContain("import { headers } from 'next/headers'")
    expect(layout).toContain('await headers()')
  })

  it('adds application-layer guards to sensitive platform data helpers', () => {
    const data = source('src/lib/data.ts')
    const allAdminsStart = data.indexOf('export async function getAllAdmins')
    const platformStatsStart = data.indexOf('export async function getPlatformStats')
    const visibleUsersStart = data.indexOf('export async function getVisibleUsersForAdminPage')

    const visibleUsers = data.slice(visibleUsersStart, allAdminsStart)
    const allAdmins = data.slice(allAdminsStart, platformStatsStart)
    const platformStats = data.slice(platformStatsStart)

    expect(data).toContain('canAccessSuperAdminArea')
    expect(visibleUsers).toContain(
      "access.role === 'owner' ? await createServiceClient() : await createClient()"
    )
    expect(allAdmins).toContain('const access = await getCurrentAccessContext()')
    expect(allAdmins).toContain('if (!access || !canAccessSuperAdminArea(access.role)) return []')
    expect(allAdmins.indexOf('getCurrentAccessContext')).toBeLessThan(
      allAdmins.indexOf(".from('users')")
    )
    expect(platformStats).toContain('const access = await getCurrentAccessContext()')
    expect(platformStats).toContain(
      'if (!access || !canAccessSuperAdminArea(access.role)) return emptyPlatformStats'
    )
    expect(platformStats.indexOf('getCurrentAccessContext')).toBeLessThan(
      platformStats.indexOf(".from('announcements')")
    )
  })

  it('keeps direct publish action admin-only before any status update', () => {
    const actions = source('src/app/(dashboard)/dashboard/announcements/[id]/edit/actions.ts')
    const publishStart = actions.indexOf('export async function publishAnnouncement')
    const unpublishStart = actions.indexOf('export async function unpublishAnnouncement')
    const publish = actions.slice(publishStart, unpublishStart)

    expect(actions).toContain('canAccessAdminArea')
    expect(publish).toContain('if (!canAccessAdminArea(announcement.actorRole))')
    expect(publish.indexOf('canAccessAdminArea')).toBeLessThan(publish.indexOf('.update({'))
  })

  it('ships an RLS policy migration that includes owner in users admin reads', () => {
    const migrationPath = 'supabase/migrations/20260521000018_owner_users_admin_policy.sql'

    expect(existsSync(migrationPath)).toBe(true)

    const migration = source(migrationPath)
    expect(migration).toContain('drop policy if exists "users: admins read all"')
    expect(migration).toContain('create policy "users: admins read all"')
    expect(migration).toContain("public.current_user_role() in ('admin', 'super_admin', 'owner')")
  })

  it('does not place invitation bearer tokens in redirect URLs', () => {
    const publisherAction = source('src/app/(admin)/admin/publishers/invite/actions.ts')
    const publisherPage = source('src/app/(admin)/admin/publishers/invite/page.tsx')
    const adminAction = source('src/app/(super-admin)/super-admin/admins/invite/actions.ts')
    const adminPage = source('src/app/(super-admin)/super-admin/admins/invite/page.tsx')

    expect(publisherAction).not.toContain('?token=${data.token}')
    expect(adminAction).not.toContain('?token=${data.token}')
    expect(publisherAction).toContain('?created=${data.id}')
    expect(adminAction).toContain('?created=${data.id}')
    expect(publisherPage).toContain('created?: string')
    expect(adminPage).toContain('created?: string')
    expect(publisherPage).toContain("select('email, token')")
    expect(adminPage).toContain("select('email, token')")
    expect(publisherPage).toContain(".eq('invited_by', access.userId)")
    expect(adminPage).toContain(".eq('invited_by', access.userId)")
  })

  it('uses parameterized SQL for owner audit search instead of raw PostgREST OR filters', () => {
    const auditPage = source('src/app/(owner)/owner/audit/page.tsx')
    const migration = source('supabase/migrations/20260521000020_parameterized_audit_search.sql')
    const databaseTypes = source('src/lib/database.types.ts')

    expect(auditPage).toContain("rpc('search_audit_log'")
    expect(auditPage).not.toContain('entriesQuery.or(')
    expect(auditPage).not.toContain('function cleanSearch')
    expect(migration).toContain('create or replace function public.search_audit_log')
    expect(migration).toContain('p_search text')
    expect(migration).toContain("a.action ilike v_like escape E'\\\\'")
    expect(migration).toContain('grant execute on function public.search_audit_log')
    expect(databaseTypes).toContain('search_audit_log: {')
  })
})
