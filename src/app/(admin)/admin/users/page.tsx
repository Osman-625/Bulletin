import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { GlassCard } from '@/components/dashboard/GlassCard'
import { logAuditEvent } from '@/lib/audit'
import {
  canAccessAdminArea,
  canManageUser,
  getCurrentAccessContext,
  getDefaultAppPath,
  type AppRole,
  type ScopedUser,
} from '@/lib/auth/authz'
import { getVisibleUsersForAdminPage } from '@/lib/data'
import { reportServerError } from '@/lib/error-reporting'
import { createServiceClient } from '@/lib/supabase/server'

export const metadata = { title: 'Users - Bulletin Admin' }

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  publisher: 'Publisher',
}

const LEVEL_COLOR: Record<string, string> = {
  admin: 'var(--color-accent-inti)',
  publisher: 'var(--color-text-muted)',
}

const EDITABLE_ROLES: AppRole[] = ['publisher']
const ADMIN_USERS_PATH = '/admin/users'
const USER_UPDATE_ERROR = 'Could not update user. Try again.'
const PASSWORD_RESET_ERROR = 'Could not reset password. Try again.'
const USER_DELETE_ERROR = 'Could not delete user. Try again.'

function userErrorHref(message: string) {
  return `${ADMIN_USERS_PATH}?error=${encodeURIComponent(message)}`
}

function adminUsersHref({ role, page }: { role?: string; page?: number }) {
  const params = new URLSearchParams()
  if (role) params.set('role', role)
  if (page && page > 1) params.set('page', String(page))
  const query = params.toString()
  return query ? `${ADMIN_USERS_PATH}?${query}` : ADMIN_USERS_PATH
}

function UserPagination({
  page,
  totalPages,
  role,
}: {
  page: number
  totalPages: number
  role?: string
}) {
  if (totalPages <= 1) return null
  const previousPage = Math.max(1, page - 1)
  const nextPage = Math.min(totalPages, page + 1)

  return (
    <nav
      aria-label="User pagination"
      className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm text-[var(--color-text-secondary)]">
        Page {page} of {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <Link
          href={adminUsersHref({ role, page: previousPage })}
          aria-disabled={page <= 1}
          className={`inline-flex min-h-10 items-center rounded-xl px-4 text-sm font-semibold transition-colors ${
            page <= 1
              ? 'pointer-events-none bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] opacity-50'
              : 'bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          Previous
        </Link>
        <Link
          href={adminUsersHref({ role, page: nextPage })}
          aria-disabled={page >= totalPages}
          className={`inline-flex min-h-10 items-center rounded-xl px-4 text-sm font-semibold transition-colors ${
            page >= totalPages
              ? 'pointer-events-none bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] opacity-50'
              : 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]'
          }`}
        >
          Next
        </Link>
      </div>
    </nav>
  )
}

async function getTargetUser(
  targetId: string
): Promise<ScopedUser & { email: string; displayName: string }> {
  const supabase = await createServiceClient()
  const { data: target, error: targetReadError } = await supabase
    .from('users')
    .select('id, email, display_name, role, organization_members ( organization_id )')
    .eq('id', targetId)
    .single()

  if (targetReadError) {
    reportServerError('admin.users.read_target', targetReadError, { targetId })
    redirect(userErrorHref(USER_UPDATE_ERROR))
  }
  if (!target) redirect('/admin/users?error=User+not+found')

  return {
    id: target.id,
    email: target.email,
    displayName: target.display_name,
    role: target.role as AppRole,
    orgIds: (target.organization_members ?? []).map((membership) => membership.organization_id),
  }
}

async function assertAdminCanManage(targetId: string) {
  const access = await getCurrentAccessContext()
  if (!access) redirect('/login')
  if (!canAccessAdminArea(access.role)) redirect(getDefaultAppPath(access.role))

  const actor: ScopedUser = {
    id: access.userId,
    role: access.role,
    orgIds: access.orgIds,
  }
  const target = await getTargetUser(targetId)

  if (!canManageUser(actor, target)) {
    throw new Error('Insufficient privilege')
  }

  return { access, target }
}

async function setRole(userId: string, newRole: string) {
  'use server'

  const { access, target } = await assertAdminCanManage(userId)
  if (!EDITABLE_ROLES.includes(newRole as AppRole) || target.role !== 'publisher') {
    throw new Error('Insufficient privilege')
  }

  const supabase = await createServiceClient()
  const { error: roleUpdateError } = await supabase
    .from('users')
    .update({ role: newRole as AppRole })
    .eq('id', userId)
  if (roleUpdateError) {
    reportServerError('admin.users.role_confirm', roleUpdateError, {
      actorId: access.userId,
      targetId: userId,
      role: newRole,
    })
    redirect(userErrorHref(USER_UPDATE_ERROR))
  }
  await logAuditEvent({
    actorId: access.userId,
    action: 'user.role_confirmed',
    targetType: 'user',
    targetId: userId,
    metadata: {
      email: target.email,
      display_name: target.displayName,
      role: newRole,
    },
  })
  revalidatePath('/admin/users')
}

async function resetPassword(userId: string, formData: FormData) {
  'use server'

  const { access, target } = await assertAdminCanManage(userId)
  if (target.role !== 'publisher') throw new Error('Insufficient privilege')

  const supabase = await createServiceClient()
  const temp = formData.get('temp_password') as string
  if (!temp || temp.length < 8) redirect('/admin/users?msg=Password+must+be+at+least+8+characters.')
  const { error: authUpdateError } = await supabase.auth.admin.updateUserById(userId, {
    password: temp,
  })
  if (authUpdateError) {
    reportServerError('admin.users.password_reset_auth', authUpdateError, {
      actorId: access.userId,
      targetId: userId,
    })
    redirect(userErrorHref(PASSWORD_RESET_ERROR))
  }
  const { error: profileUpdateError } = await supabase
    .from('users')
    .update({ force_password_change: true })
    .eq('id', userId)
  if (profileUpdateError) {
    reportServerError('admin.users.password_reset_profile', profileUpdateError, {
      actorId: access.userId,
      targetId: userId,
    })
    redirect(userErrorHref(PASSWORD_RESET_ERROR))
  }
  await logAuditEvent({
    actorId: access.userId,
    action: 'user.password_reset',
    targetType: 'user',
    targetId: userId,
    metadata: {
      email: target.email,
      display_name: target.displayName,
      role: target.role,
      force_password_change: true,
    },
  })
  revalidatePath('/admin/users')
  redirect('/admin/users?msg=Password+updated.+User+will+be+prompted+to+change+it+on+next+login.')
}

async function deleteUser(userId: string) {
  'use server'

  const { access, target } = await assertAdminCanManage(userId)
  if (target.role !== 'publisher') throw new Error('Insufficient privilege')

  const supabase = await createServiceClient()
  const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId)
  if (authDeleteError) {
    reportServerError('admin.users.delete_auth', authDeleteError, {
      actorId: access.userId,
      targetId: userId,
    })
    redirect(userErrorHref(USER_DELETE_ERROR))
  }
  await logAuditEvent({
    actorId: access.userId,
    action: 'user.deleted',
    targetType: 'user',
    targetId: userId,
    metadata: {
      email: target.email,
      display_name: target.displayName,
      previous_role: target.role,
      org_ids: target.orgIds,
    },
  })
  revalidatePath('/admin/users')
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    role?: string
    msg?: string
    edit?: string
    confirm?: string
    error?: string
    page?: string
  }>
}) {
  const { role: filterRole, msg, edit, confirm, error, page } = await searchParams
  const access = await getCurrentAccessContext()
  if (!access) redirect('/login')
  if (!canAccessAdminArea(access.role)) redirect(getDefaultAppPath(access.role))

  const actor: ScopedUser = {
    id: access.userId,
    role: access.role,
    orgIds: access.orgIds,
  }

  const visibleUsersPage = await getVisibleUsersForAdminPage({ role: filterRole, page })
  const users = visibleUsersPage.items as Array<{
    id: string
    email: string
    display_name: string
    role: AppRole
    organization_members?: Array<{ organization_id: string }>
    force_password_change?: boolean
    created_at: string
  }>
  const roleCounts = visibleUsersPage.roleCounts
  const base = adminUsersHref({ role: filterRole, page: visibleUsersPage.page })
  const separator = base.includes('?') ? '&' : '?'

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Users
          </h1>
          <p className="mt-1 text-[var(--color-text-secondary)]">
            {visibleUsersPage.total} users
            {filterRole ? ` - ${ROLE_LABELS[filterRole] ?? filterRole}` : ''}
          </p>
        </div>
        <Link
          href="/admin/publishers/invite"
          className="shrink-0 rounded-xl bg-[var(--color-accent)] px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
        >
          Invite Publisher
        </Link>
      </div>

      {msg && (
        <div className="rounded-xl bg-[var(--color-status-submitted-bg)] px-4 py-3 font-mono text-sm text-[var(--color-status-submitted-text)]">
          {msg}
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-[var(--color-status-rejected-bg)] px-4 py-3 text-sm text-[var(--color-status-rejected-text)]">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {[
          { key: '', label: `All (${visibleUsersPage.allTotal})` },
          ...Object.keys(ROLE_LABELS).map((role) => ({
            key: role,
            label: `${ROLE_LABELS[role]} (${roleCounts[role] ?? 0})`,
          })),
        ].map(({ key, label }) => (
          <a
            key={key}
            href={adminUsersHref({ role: key || undefined })}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filterRole === key || (!filterRole && !key)
                ? 'bg-[var(--color-accent)] text-white'
                : 'bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            {label}
          </a>
        ))}
      </div>

      <div className="space-y-2">
        {users.length === 0 && (
          <GlassCard hover={false} className="p-8">
            <div role="status" className="mx-auto max-w-md text-center">
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                No users match this view
              </p>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                {filterRole
                  ? `There are no ${ROLE_LABELS[filterRole] ?? filterRole} users in your scope.`
                  : 'No users are visible in your admin scope yet.'}
              </p>
              {filterRole && (
                <Link
                  href="/admin/users"
                  className="mt-4 inline-flex min-h-10 items-center rounded-xl bg-[var(--color-surface-elevated)] px-4 text-xs font-semibold text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
                >
                  Clear the role filter
                </Link>
              )}
            </div>
          </GlassCard>
        )}
        {users.map((user) => {
          const role = user.role as AppRole
          const isEditing = edit === user.id
          const isConfirming = confirm === user.id
          const target: ScopedUser = {
            id: user.id,
            role,
            orgIds: (user.organization_members ?? []).map(
              (membership: { organization_id: string }) => membership.organization_id
            ),
          }
          const canManage = role === 'publisher' && canManageUser(actor, target)

          return (
            <GlassCard
              key={user.id}
              data-testid="user-card"
              data-user-email={user.email}
              data-user-role={role}
              data-current-user={user.id === access.userId ? 'true' : 'false'}
              hover={false}
              className={
                isConfirming
                  ? 'ring-1 ring-[var(--color-status-rejected-text)]'
                  : isEditing
                    ? 'ring-1 ring-[var(--color-accent)]'
                    : ''
              }
            >
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-elevated)]">
                  <span className="text-sm font-bold text-[var(--color-text-secondary)]">
                    {user.display_name.charAt(0).toUpperCase()}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                      {user.display_name}
                    </p>
                    <span className="rounded bg-[var(--color-surface-elevated)] px-2 py-0.5 text-[15px] font-bold tracking-wider text-[var(--color-text-muted)] uppercase">
                      {ROLE_LABELS[role] ?? role}
                    </span>
                    <span
                      className="rounded bg-[var(--color-surface-elevated)] px-1.5 py-0.5 font-mono text-[15px] font-bold"
                      style={{ color: LEVEL_COLOR[role] ?? 'var(--color-text-muted)' }}
                    >
                      L{role === 'admin' ? 2 : 3}
                    </span>
                    {user.id === access.userId && (
                      <span className="rounded bg-[var(--color-accent-surface)] px-2 py-0.5 text-[15px] font-bold tracking-wider text-[var(--color-accent)] uppercase">
                        You
                      </span>
                    )}
                    {user.force_password_change && (
                      <span className="rounded bg-[var(--color-status-submitted-bg)] px-2 py-0.5 text-[15px] font-bold tracking-wider text-[var(--color-status-submitted-text)] uppercase">
                        Must change pw
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{user.email}</p>
                </div>

                <p className="hidden shrink-0 font-mono text-xs text-[var(--color-text-muted)] sm:block">
                  {new Date(user.created_at).toLocaleDateString('en-MY', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>

                {canManage && !isEditing && !isConfirming && (
                  <div className="flex shrink-0 gap-2">
                    <a
                      href={`${base}${separator}edit=${user.id}`}
                      className="rounded-lg bg-[var(--color-surface-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
                    >
                      Edit
                    </a>
                    <a
                      href={`${base}${separator}confirm=${user.id}`}
                      className="rounded-lg bg-[var(--color-status-rejected-bg)] px-3 py-1.5 text-xs font-medium text-[var(--color-status-rejected-text)] transition-opacity hover:opacity-80"
                    >
                      Delete
                    </a>
                  </div>
                )}

                {(isEditing || isConfirming) && (
                  <a
                    href={base}
                    className="shrink-0 rounded-lg bg-[var(--color-surface-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
                  >
                    Cancel
                  </a>
                )}
              </div>

              {isEditing && canManage && (
                <div className="space-y-4 border-t border-[var(--color-border)] px-5 pt-3 pb-4">
                  <p className="text-xs font-medium tracking-wider text-[var(--color-text-secondary)] uppercase">
                    Publisher Controls
                  </p>
                  <form action={setRole.bind(null, user.id, 'publisher')}>
                    <button
                      type="submit"
                      className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-xs font-semibold text-white"
                    >
                      Keep as Publisher <span className="font-mono opacity-60">L3</span>
                    </button>
                  </form>
                  <form
                    action={resetPassword.bind(null, user.id)}
                    className="flex items-center gap-2"
                  >
                    <input
                      name="temp_password"
                      type="password"
                      required
                      minLength={8}
                      placeholder="New temp password"
                      className="w-48 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:ring-1 focus:ring-[var(--color-accent)] focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="shrink-0 rounded-xl bg-[var(--color-status-submitted-bg)] px-4 py-2 text-xs font-semibold text-[var(--color-status-submitted-text)] transition-opacity hover:opacity-80"
                    >
                      Set Password
                    </button>
                  </form>
                </div>
              )}

              {isConfirming && canManage && (
                <div className="space-y-3 border-t border-[var(--color-border)] px-5 pt-3 pb-4">
                  <p className="text-sm font-semibold text-[var(--color-status-rejected-text)]">
                    Delete {user.display_name}?
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    This permanently removes their account and all associated data. This cannot be
                    undone.
                  </p>
                  <form action={deleteUser.bind(null, user.id)}>
                    <button
                      type="submit"
                      className="rounded-xl bg-[var(--color-status-rejected-text)] px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-80"
                    >
                      Yes, delete permanently
                    </button>
                  </form>
                </div>
              )}
            </GlassCard>
          )
        })}
      </div>
      <UserPagination
        page={visibleUsersPage.page}
        totalPages={visibleUsersPage.totalPages}
        role={filterRole}
      />
    </div>
  )
}
