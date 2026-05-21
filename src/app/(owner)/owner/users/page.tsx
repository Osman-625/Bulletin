import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { GlassCard } from '@/components/dashboard/GlassCard'
import { logAuditEvent } from '@/lib/audit'
import { createServiceClient } from '@/lib/supabase/server'
import {
  canAccessOwnerArea,
  canManageUser,
  getAssignableRoles,
  getCurrentAccessContext,
  getDefaultAppPath,
  type AppRole,
} from '@/lib/auth/authz'
import { syncAuthUsersToProfiles } from '@/lib/auth/sync-users'
import { reportServerError } from '@/lib/error-reporting'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'All Users — Bulletin Owner' }

const PRIVILEGE = { owner: 0, super_admin: 1, admin: 2, publisher: 3 } as const
type UserRole = keyof typeof PRIVILEGE

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  super_admin: 'Super Admin',
  admin: 'Admin',
  publisher: 'Publisher',
}

const LEVEL_COLOR: Record<number, string> = {
  0: 'var(--color-gold)',
  1: '#7C3AED',
  2: 'var(--color-accent-inti)',
  3: 'var(--color-text-muted)',
}

const OWNER_USERS_PATH = '/owner/users'
const USER_CREATE_ERROR = 'Could not create user. Try again.'
const USER_UPDATE_ERROR = 'Could not update user. Try again.'
const PASSWORD_RESET_ERROR = 'Could not reset password. Try again.'
const USER_DELETE_ERROR = 'Could not delete user. Try again.'
const OWNER_USERS_PAGE_SIZE = 24

function userErrorHref(message: string, add = false) {
  const key = add ? 'err' : 'error'
  const prefix = add ? `${OWNER_USERS_PATH}?add=true&` : `${OWNER_USERS_PATH}?`
  return `${prefix}${key}=${encodeURIComponent(message)}`
}

function parseUsersPage(pageInput?: string | number | null) {
  const parsedPage =
    typeof pageInput === 'number' ? pageInput : Number.parseInt(pageInput ?? '1', 10)
  return Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1
}

function ownerUsersHref({ role, page }: { role?: string; page?: number }) {
  const params = new URLSearchParams()
  if (role) params.set('role', role)
  if (page && page > 1) params.set('page', String(page))
  const query = params.toString()
  return query ? `${OWNER_USERS_PATH}?${query}` : OWNER_USERS_PATH
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
        <a
          href={ownerUsersHref({ role, page: previousPage })}
          aria-disabled={page <= 1}
          className={`inline-flex min-h-10 items-center rounded-xl px-4 text-sm font-semibold transition-colors ${
            page <= 1
              ? 'pointer-events-none bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] opacity-50'
              : 'bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          Previous
        </a>
        <a
          href={ownerUsersHref({ role, page: nextPage })}
          aria-disabled={page >= totalPages}
          className={`inline-flex min-h-10 items-center rounded-xl px-4 text-sm font-semibold transition-colors ${
            page >= totalPages
              ? 'pointer-events-none bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] opacity-50'
              : 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]'
          }`}
        >
          Next
        </a>
      </div>
    </nav>
  )
}

async function createUser(formData: FormData) {
  'use server'

  const access = await getCurrentAccessContext()
  if (!access) redirect('/login')
  if (!canAccessOwnerArea(access.role)) redirect(getDefaultAppPath(access.role))

  const supabase = await createServiceClient()
  const displayName = (formData.get('display_name') as string).trim()
  const rawEmail = (formData.get('email') as string).trim()
  const email = rawEmail || `${displayName.toLowerCase().replace(/\s+/g, '_')}@bulletin.internal`
  const password = formData.get('password') as string
  const role = formData.get('role') as AppRole
  const assignableRoles = getAssignableRoles(access.role)
  if (!displayName || !password || !role) redirect('/owner/users?add=true&err=missing_fields')
  if (!assignableRoles.includes(role)) redirect('/owner/users?add=true&err=invalid_role')
  const { data: authData, error: authCreateError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName, role },
  })
  if (authCreateError || !authData.user) {
    reportServerError(
      'owner.users.create_auth',
      authCreateError ?? new Error('Supabase Auth did not return a user'),
      { actorId: access.userId, email, role }
    )
    redirect(userErrorHref(USER_CREATE_ERROR, true))
  }
  const { error: profileUpsertError } = await supabase
    .from('users')
    .upsert(
      { id: authData.user.id, email, display_name: displayName, role, force_password_change: true },
      { onConflict: 'id' }
    )
  if (profileUpsertError) {
    reportServerError('owner.users.create_profile', profileUpsertError, {
      actorId: access.userId,
      targetId: authData.user.id,
      email,
      role,
    })
    redirect(userErrorHref(USER_CREATE_ERROR, true))
  }
  await logAuditEvent({
    actorId: access.userId,
    action: 'user.created',
    targetType: 'user',
    targetId: authData.user.id,
    metadata: {
      email,
      display_name: displayName,
      role,
      force_password_change: true,
    },
  })
  revalidatePath('/owner/users')
  redirect('/owner/users')
}

async function setRole(userId: string, newRole: string) {
  'use server'

  const access = await getCurrentAccessContext()
  if (!access) redirect('/login')
  if (!canAccessOwnerArea(access.role)) redirect(getDefaultAppPath(access.role))
  const role = newRole as AppRole
  if (!getAssignableRoles(access.role).includes(role)) return

  const supabase = await createServiceClient()
  const { data: target, error: targetReadError } = await supabase
    .from('users')
    .select('id, email, display_name, role')
    .eq('id', userId)
    .single()
  if (targetReadError) {
    reportServerError('owner.users.read_for_role_change', targetReadError, {
      actorId: access.userId,
      targetId: userId,
    })
    redirect(userErrorHref(USER_UPDATE_ERROR))
  }
  if (!target) return
  if (
    !canManageUser(
      { id: access.userId, role: access.role, orgIds: access.orgIds },
      { id: target.id, role: target.role as AppRole, orgIds: [] }
    )
  )
    return
  const { error: roleUpdateError } = await supabase.from('users').update({ role }).eq('id', userId)
  if (roleUpdateError) {
    reportServerError('owner.users.role_change', roleUpdateError, {
      actorId: access.userId,
      targetId: userId,
      role,
    })
    redirect(userErrorHref(USER_UPDATE_ERROR))
  }
  await logAuditEvent({
    actorId: access.userId,
    action: 'user.role_changed',
    targetType: 'user',
    targetId: userId,
    metadata: {
      email: target.email,
      display_name: target.display_name,
      previous_role: target.role,
      new_role: role,
    },
  })
  revalidatePath('/owner/users')
}

async function resetPassword(userId: string, formData: FormData) {
  'use server'

  const access = await getCurrentAccessContext()
  if (!access) redirect('/login')
  if (!canAccessOwnerArea(access.role)) redirect(getDefaultAppPath(access.role))

  const supabase = await createServiceClient()
  const { data: target, error: targetReadError } = await supabase
    .from('users')
    .select('id, email, display_name, role')
    .eq('id', userId)
    .single()
  if (targetReadError) {
    reportServerError('owner.users.read_for_password_reset', targetReadError, {
      actorId: access.userId,
      targetId: userId,
    })
    redirect(userErrorHref(PASSWORD_RESET_ERROR))
  }
  if (!target) return
  if (
    !canManageUser(
      { id: access.userId, role: access.role, orgIds: access.orgIds },
      { id: target.id, role: target.role as AppRole, orgIds: [] }
    )
  )
    return
  const temp = formData.get('temp_password') as string
  if (!temp || temp.length < 8) redirect('/owner/users?msg=Password+must+be+at+least+8+characters.')
  const { error: authUpdateError } = await supabase.auth.admin.updateUserById(userId, {
    password: temp,
  })
  if (authUpdateError) {
    reportServerError('owner.users.password_reset_auth', authUpdateError, {
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
    reportServerError('owner.users.password_reset_profile', profileUpdateError, {
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
      display_name: target.display_name,
      role: target.role,
      force_password_change: true,
    },
  })
  revalidatePath('/owner/users')
  redirect('/owner/users?msg=Password+updated.+User+will+be+prompted+to+change+it+on+next+login.')
}

async function deleteUser(userId: string) {
  'use server'

  const access = await getCurrentAccessContext()
  if (!access) redirect('/login')
  if (!canAccessOwnerArea(access.role)) redirect(getDefaultAppPath(access.role))

  const supabase = await createServiceClient()
  const { data: target, error: targetReadError } = await supabase
    .from('users')
    .select('id, email, display_name, role')
    .eq('id', userId)
    .single()
  if (targetReadError) {
    reportServerError('owner.users.read_for_delete', targetReadError, {
      actorId: access.userId,
      targetId: userId,
    })
    redirect(userErrorHref(USER_DELETE_ERROR))
  }
  if (!target) return
  if (
    !canManageUser(
      { id: access.userId, role: access.role, orgIds: access.orgIds },
      { id: target.id, role: target.role as AppRole, orgIds: [] }
    )
  )
    return
  const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId)
  if (authDeleteError) {
    reportServerError('owner.users.delete_auth', authDeleteError, {
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
      display_name: target.display_name,
      previous_role: target.role,
    },
  })
  revalidatePath('/owner/users')
}

export default async function OwnerUsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    role?: string
    msg?: string
    edit?: string
    confirm?: string
    add?: string
    err?: string
    error?: string
    page?: string
  }>
}) {
  const { role: filterRole, msg, edit, confirm, add, err, error, page } = await searchParams
  const isAdding = add === 'true'
  const access = await getCurrentAccessContext()
  if (!access) redirect('/login')
  if (!canAccessOwnerArea(access.role)) redirect(getDefaultAppPath(access.role))

  await syncAuthUsersToProfiles()

  const assignableRoles = getAssignableRoles(access.role)
  const supabase = await createServiceClient()
  const myId = access.userId

  const usersPage = parseUsersPage(page)
  const from = (usersPage - 1) * OWNER_USERS_PAGE_SIZE
  const to = from + OWNER_USERS_PAGE_SIZE - 1

  let query = supabase
    .from('users')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
  if (filterRole && ROLE_LABELS[filterRole]) query = query.eq('role', filterRole as AppRole)
  const { data: usersData, count: usersTotal, error: usersError } = await query.range(from, to)
  if (usersError) {
    reportServerError('owner.users.list_query', usersError, {
      actorId: access.userId,
      filterRole: filterRole ?? null,
      page: usersPage,
    })
  }

  const roleCountEntries = await Promise.all(
    Object.keys(ROLE_LABELS).map(async (role) => {
      const { count, error: roleCountError } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('role', role as AppRole)
      if (roleCountError) {
        reportServerError('owner.users.role_count_query', roleCountError, {
          actorId: access.userId,
          countedRole: role,
        })
      }
      return [role, count ?? 0] as const
    })
  )

  const users = usersError ? [] : (usersData ?? [])
  const roleCounts = Object.fromEntries(roleCountEntries)
  const allUsersTotal = Object.values(roleCounts).reduce((sum, count) => sum + count, 0)
  const visibleUsersTotal = usersTotal ?? users.length
  const totalPages = Math.max(1, Math.ceil(visibleUsersTotal / OWNER_USERS_PAGE_SIZE))

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
            All Users
          </h1>
          <p className="mt-1 text-[var(--color-text-secondary)]">
            {visibleUsersTotal} users
            {filterRole ? ` · ${ROLE_LABELS[filterRole] ?? filterRole}` : ''}
          </p>
        </div>
        <a
          href={isAdding ? '/owner/users' : '/owner/users?add=true'}
          className={`shrink-0 rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${isAdding ? 'bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)]' : 'bg-[var(--color-accent)] text-white hover:opacity-90'}`}
        >
          {isAdding ? 'Cancel' : '+ Add User'}
        </a>
      </div>

      {isAdding && (
        <GlassCard hover={false} className="p-6">
          <p className="mb-4 text-sm font-semibold text-[var(--color-text-primary)]">New User</p>
          {err && (
            <p className="mb-3 text-xs text-[var(--color-status-rejected-text)]">
              {err === 'missing_fields'
                ? 'All fields are required.'
                : err === 'invalid_role'
                  ? 'That role is not allowed from this screen.'
                  : err}
            </p>
          )}
          <form action={createUser} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
                  Username *
                </label>
                <input
                  name="display_name"
                  required
                  placeholder="john_doe"
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:ring-1 focus:ring-[var(--color-accent)] focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
                  Email <span className="opacity-50">(optional)</span>
                </label>
                <input
                  name="email"
                  type="email"
                  placeholder="user@inti.edu.my"
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:ring-1 focus:ring-[var(--color-accent)] focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
                  Temporary password *
                </label>
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="Must be changed on login"
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:ring-1 focus:ring-[var(--color-accent)] focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">
                  Role *
                </label>
                <select
                  name="role"
                  required
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:ring-1 focus:ring-[var(--color-accent)] focus:outline-none"
                >
                  {assignableRoles.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]} (L{PRIVILEGE[r]})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="rounded-xl bg-[var(--color-accent)] px-5 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
            >
              Create User
            </button>
            <p className="text-xs text-[var(--color-text-muted)]">
              The user must replace this temporary password the first time they sign in.
            </p>
          </form>
        </GlassCard>
      )}

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
          { key: '', label: `All (${allUsersTotal})` },
          ...Object.keys(ROLE_LABELS).map((r) => ({
            key: r,
            label: `${ROLE_LABELS[r]} (${roleCounts[r] ?? 0})`,
          })),
        ].map(({ key, label }) => (
          <a
            key={key}
            href={ownerUsersHref({ role: key || undefined })}
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
                  ? `There are no ${ROLE_LABELS[filterRole] ?? filterRole} users on the platform.`
                  : 'No synced users are available yet.'}
              </p>
              {filterRole && (
                <a
                  href="/owner/users"
                  className="mt-4 inline-flex min-h-10 items-center rounded-xl bg-[var(--color-surface-elevated)] px-4 text-xs font-semibold text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
                >
                  Clear the role filter
                </a>
              )}
            </div>
          </GlassCard>
        )}
        {users.map((u) => {
          const isMe = u.id === myId
          const role = u.role as UserRole
          const level = PRIVILEGE[role] ?? 3
          const isEditing = edit === u.id
          const isConfirming = confirm === u.id
          const canManage = canManageUser(
            { id: access.userId, role: access.role, orgIds: access.orgIds },
            { id: u.id, role: role as AppRole, orgIds: [] }
          )
          const base = ownerUsersHref({ role: filterRole, page: usersPage })
          const separator = base.includes('?') ? '&' : '?'

          return (
            <GlassCard
              key={u.id}
              data-testid="user-card"
              data-user-email={u.email}
              data-user-role={role}
              data-current-user={isMe ? 'true' : 'false'}
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
                    {u.display_name.charAt(0).toUpperCase()}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                      {u.display_name}
                    </p>
                    <span className="rounded bg-[var(--color-surface-elevated)] px-2 py-0.5 text-[15px] font-bold tracking-wider text-[var(--color-text-muted)] uppercase">
                      {ROLE_LABELS[role] ?? role}
                    </span>
                    <span
                      className="rounded bg-[var(--color-surface-elevated)] px-1.5 py-0.5 font-mono text-[15px] font-bold"
                      style={{ color: LEVEL_COLOR[level] }}
                    >
                      L{level}
                    </span>
                    {isMe && (
                      <span className="rounded bg-[var(--color-accent-surface)] px-2 py-0.5 text-[15px] font-bold tracking-wider text-[var(--color-accent)] uppercase">
                        You
                      </span>
                    )}
                    {u.force_password_change && (
                      <span className="rounded bg-[var(--color-status-submitted-bg)] px-2 py-0.5 text-[15px] font-bold tracking-wider text-[var(--color-status-submitted-text)] uppercase">
                        Must change pw
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{u.email}</p>
                </div>

                <p className="hidden shrink-0 font-mono text-xs text-[var(--color-text-muted)] sm:block">
                  {new Date(u.created_at).toLocaleDateString('en-MY', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>

                {canManage && !isEditing && !isConfirming && (
                  <div className="flex shrink-0 gap-2">
                    <a
                      href={`${base}${separator}edit=${u.id}`}
                      className="rounded-lg bg-[var(--color-surface-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
                    >
                      Edit
                    </a>
                    <a
                      href={`${base}${separator}confirm=${u.id}`}
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
                    Assign Role
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {assignableRoles.map((r) => (
                      <form key={r} action={setRole.bind(null, u.id, r)}>
                        <button
                          type="submit"
                          className={`rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
                            role === r
                              ? 'bg-[var(--color-accent)] text-white'
                              : 'bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:bg-[var(--color-accent-surface)] hover:text-[var(--color-accent)]'
                          }`}
                        >
                          {ROLE_LABELS[r]}{' '}
                          <span className="font-mono opacity-50">L{PRIVILEGE[r]}</span>
                        </button>
                      </form>
                    ))}
                  </div>
                  <form action={resetPassword.bind(null, u.id)} className="flex items-center gap-2">
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
                    Delete {u.display_name}?
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    This permanently removes their account and all associated data. This cannot be
                    undone.
                  </p>
                  <form action={deleteUser.bind(null, u.id)}>
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
      <UserPagination page={usersPage} totalPages={totalPages} role={filterRole} />
    </div>
  )
}
