import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { UserPlus } from 'lucide-react'
import { DashboardBoardHeader, DashboardBoardPage } from '@/components/dashboard/DashboardBoard'
import { GlassCard } from '@/components/dashboard/GlassCard'
import { logAuditEvent } from '@/modules/audit'
import { formatCampusDateTime, formatCampusShortDate } from '@/modules/announcements/public-board'
import {
  canAccessSuperAdminArea,
  canManageUser,
  getAssignableRoles,
  getCurrentAccessContext,
  getDefaultAppPath,
  type AppRole,
  type ScopedUser,
} from '@/modules/auth/authz'
import {
  TEMPORARY_PASSWORD_MIN_LENGTH,
  validateTemporaryPassword,
} from '@/modules/auth/password-policy'
import { syncAuthUsersToProfiles } from '@/modules/auth/sync-users'
import { reportServerError } from '@/shared/errors/error-reporting'
import { createServiceClient } from '@/infrastructure/database/server'
import type { DbUser } from '@/shared/types'
import { PasswordResetRequestButton } from './PasswordResetRequestButton'

export const metadata = { title: 'Users - Bulletin Super Admin' }

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  publisher: 'Publisher',
}
const SUPER_ADMIN_ROLE_KEYS = Object.keys(ROLE_LABELS)

const LEVEL_COLOR: Record<string, string> = {
  super_admin: 'var(--color-navy)',
  admin: 'var(--color-accent-inti)',
  publisher: 'var(--color-text-muted)',
}

function superAdminRoleLevel(role: string) {
  if (role === 'super_admin') return 1
  if (role === 'admin') return 2
  return 3
}

const SUPER_ADMIN_USERS_PATH = '/super-admin/users'
const USER_CREATE_ERROR = 'Could not create user. Try again.'
const USER_UPDATE_ERROR = 'Could not update user. Try again.'
const PASSWORD_RESET_ERROR = 'Could not reset password. Try again.'
const USER_DELETE_ERROR = 'Could not delete user. Try again.'
const SUPER_ADMIN_USERS_PAGE_SIZE = 24

function userErrorHref(message: string, add = false) {
  const key = add ? 'err' : 'error'
  const prefix = add ? `${SUPER_ADMIN_USERS_PATH}?add=true&` : `${SUPER_ADMIN_USERS_PATH}?`
  return `${prefix}${key}=${encodeURIComponent(message)}`
}

function parseUsersPage(pageInput?: string | number | null) {
  const parsedPage =
    typeof pageInput === 'number' ? pageInput : Number.parseInt(pageInput ?? '1', 10)
  return Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1
}

function superAdminUsersHref({ role, page }: { role?: string; page?: number }) {
  const params = new URLSearchParams()
  if (role) params.set('role', role)
  if (page && page > 1) params.set('page', String(page))
  const query = params.toString()
  return query ? `${SUPER_ADMIN_USERS_PATH}?${query}` : SUPER_ADMIN_USERS_PATH
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
          href={superAdminUsersHref({ role, page: previousPage })}
          aria-disabled={page <= 1}
          className={`inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold transition-colors ${
            page <= 1
              ? 'pointer-events-none bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] opacity-50'
              : 'bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          Previous
        </Link>
        <Link
          href={superAdminUsersHref({ role, page: nextPage })}
          aria-disabled={page >= totalPages}
          className={`inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold transition-colors ${
            page >= totalPages
              ? 'pointer-events-none bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] opacity-50'
              : 'bg-[var(--color-accent)] text-[var(--color-on-accent)] hover:bg-[var(--color-accent-hover)]'
          }`}
        >
          Next
        </Link>
      </div>
    </nav>
  )
}

async function getUsers({ role, page: pageInput }: { role?: string; page?: string | null } = {}) {
  const supabase = await createServiceClient()
  const page = parseUsersPage(pageInput)
  const from = (page - 1) * SUPER_ADMIN_USERS_PAGE_SIZE
  const to = from + SUPER_ADMIN_USERS_PAGE_SIZE - 1

  let query = supabase
    .from('users')
    .select('*', { count: 'exact' })
    .neq('role', 'owner')
    .order('created_at', { ascending: false })

  if (role && ROLE_LABELS[role]) query = query.eq('role', role as AppRole)

  const { data, count, error } = await query.range(from, to)
  if (error) {
    reportServerError('super_admin.users.list_query', error, {
      filterRole: role ?? null,
      page,
    })
  }

  return {
    items: error ? [] : (data ?? []),
    total: count ?? data?.length ?? 0,
    page,
    pageSize: SUPER_ADMIN_USERS_PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil((count ?? data?.length ?? 0) / SUPER_ADMIN_USERS_PAGE_SIZE)),
  }
}

async function getSuperAdminUserRoleCounts() {
  const supabase = await createServiceClient()
  const entries = await Promise.all(
    SUPER_ADMIN_ROLE_KEYS.map(async (role) => {
      const { count, error } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('role', role as AppRole)
      if (error) {
        reportServerError('super_admin.users.role_count_query', error, { countedRole: role })
      }
      return [role, count ?? 0] as const
    })
  )
  return Object.fromEntries(entries)
}

async function getPendingPasswordResetRequests() {
  const supabase = await createServiceClient()
  const { data } = await supabase
    .from('password_reset_requests')
    .select('id, user_id, email, created_at, users ( display_name, email, role )')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  return data ?? []
}

async function getTargetUser(
  targetId: string
): Promise<ScopedUser & { email: string; displayName: string }> {
  const supabase = await createServiceClient()
  const { data: user, error: targetReadError } = await supabase
    .from('users')
    .select('id, email, display_name, role')
    .eq('id', targetId)
    .single()

  if (targetReadError) {
    reportServerError('super_admin.users.read_target', targetReadError, { targetId })
    redirect(userErrorHref(USER_UPDATE_ERROR))
  }
  if (!user) redirect('/super-admin/users?error=User+not+found')
  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    role: user.role as AppRole,
    orgIds: [],
  }
}

async function assertSuperAdminCanManage(targetId: string) {
  const access = await getCurrentAccessContext()
  if (!access) redirect('/login')
  if (!canAccessSuperAdminArea(access.role)) redirect(getDefaultAppPath(access.role))

  const actor: ScopedUser = {
    id: access.userId,
    role: access.role,
    orgIds: access.orgIds,
  }
  const target = await getTargetUser(targetId)

  if (!canManageUser(actor, target)) throw new Error('Cannot manage this user')
  return { access, target }
}

async function createUser(formData: FormData) {
  'use server'

  const access = await getCurrentAccessContext()
  if (!access) redirect('/login')
  if (!canAccessSuperAdminArea(access.role)) redirect(getDefaultAppPath(access.role))

  const displayName = (formData.get('display_name') as string).trim()
  const rawEmail = (formData.get('email') as string).trim()
  const email = rawEmail || `${displayName.toLowerCase().replace(/\s+/g, '_')}@bulletin.internal`
  const password = formData.get('password') as string
  const role = formData.get('role') as AppRole
  const assignableRoles = getAssignableRoles(access.role)

  if (!displayName || !password || !role) {
    redirect('/super-admin/users?add=true&err=missing_fields')
  }

  if (!assignableRoles.includes(role)) {
    redirect('/super-admin/users?add=true&err=invalid_role')
  }

  const passwordValidation = validateTemporaryPassword(password)
  if (!passwordValidation.valid) {
    redirect(userErrorHref(passwordValidation.message, true))
  }

  const supabase = await createServiceClient()
  const { data: authData, error: authCreateError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName, role },
  })

  if (authCreateError || !authData.user) {
    reportServerError(
      'super_admin.users.create_auth',
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
    reportServerError('super_admin.users.create_profile', profileUpsertError, {
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

  revalidatePath('/super-admin/users')
  redirect('/super-admin/users')
}

async function setRole(userId: string, newRole: string) {
  'use server'

  const { access, target } = await assertSuperAdminCanManage(userId)
  const assignableRoles = getAssignableRoles(access.role)
  const role = newRole as AppRole
  if (!assignableRoles.includes(role)) throw new Error('Cannot manage this user')

  const supabase = await createServiceClient()
  const { error: roleUpdateError } = await supabase.from('users').update({ role }).eq('id', userId)
  if (roleUpdateError) {
    reportServerError('super_admin.users.role_change', roleUpdateError, {
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
      display_name: target.displayName,
      previous_role: target.role,
      new_role: role,
    },
  })
  revalidatePath('/super-admin/users')
}

async function resetPassword(userId: string, formData: FormData) {
  'use server'

  const [{ access, target }, supabase] = await Promise.all([
    assertSuperAdminCanManage(userId),
    createServiceClient(),
  ])
  const temp = formData.get('temp_password') as string
  const passwordValidation = validateTemporaryPassword(temp)
  if (!passwordValidation.valid) redirect(userErrorHref(passwordValidation.message))
  const { error: authUpdateError } = await supabase.auth.admin.updateUserById(userId, {
    password: temp,
  })
  if (authUpdateError) {
    reportServerError('super_admin.users.password_reset_auth', authUpdateError, {
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
    reportServerError('super_admin.users.password_reset_profile', profileUpdateError, {
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
  revalidatePath('/super-admin/users')
  redirect(
    '/super-admin/users?msg=Password+updated.+User+will+be+prompted+to+change+it+on+next+login.'
  )
}

async function deleteUser(userId: string) {
  'use server'

  const [{ access, target }, supabase] = await Promise.all([
    assertSuperAdminCanManage(userId),
    createServiceClient(),
  ])
  const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId)
  if (authDeleteError) {
    reportServerError('super_admin.users.delete_auth', authDeleteError, {
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
    },
  })
  revalidatePath('/super-admin/users')
}

function superAdminUserFormError(error: string) {
  if (error === 'missing_fields') return 'All fields are required.'
  if (error === 'invalid_role') return 'That role is not allowed from this screen.'
  return error
}

function SuperAdminNewUserForm({
  err,
  assignableRoles,
}: {
  err?: string
  assignableRoles: AppRole[]
}) {
  return (
    <GlassCard hover={false} className="p-6">
      <p className="mb-4 text-sm font-semibold text-[var(--color-text-primary)]">New User</p>
      {err && (
        <p className="mb-3 text-xs text-[var(--color-status-rejected-text)]">
          {superAdminUserFormError(err)}
        </p>
      )}
      <form action={createUser} className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor="super-admin-user-display-name"
              className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]"
            >
              Username *
            </label>
            <input
              id="super-admin-user-display-name"
              name="display_name"
              required
              placeholder="john_doe"
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:ring-1 focus:ring-[var(--color-accent)] focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="super-admin-user-email"
              className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]"
            >
              Email <span className="opacity-50">(optional)</span>
            </label>
            <input
              id="super-admin-user-email"
              name="email"
              type="email"
              placeholder="user@inti.edu.my"
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:ring-1 focus:ring-[var(--color-accent)] focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="super-admin-user-password"
              className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]"
            >
              Temporary password *
            </label>
            <input
              id="super-admin-user-password"
              name="password"
              type="password"
              required
              minLength={TEMPORARY_PASSWORD_MIN_LENGTH}
              placeholder={`At least ${TEMPORARY_PASSWORD_MIN_LENGTH} characters`}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:ring-1 focus:ring-[var(--color-accent)] focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="super-admin-user-role"
              className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]"
            >
              Role *
            </label>
            <select
              id="super-admin-user-role"
              name="role"
              required
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:ring-1 focus:ring-[var(--color-accent)] focus:outline-none"
            >
              {assignableRoles.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]} (L{superAdminRoleLevel(role)})
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          type="submit"
          className="min-h-11 rounded-xl bg-[var(--color-accent)] px-5 text-xs font-bold text-[var(--color-on-accent)] transition-opacity hover:opacity-90"
        >
          Create User
        </button>
        <p className="text-xs text-[var(--color-text-muted)]">
          The user must replace this temporary password the first time they sign in.
        </p>
      </form>
    </GlassCard>
  )
}

function PasswordResetRequestsPanel({
  requests,
  highlightedResetRequest,
}: {
  requests: Awaited<ReturnType<typeof getPendingPasswordResetRequests>>
  highlightedResetRequest?: string
}) {
  if (requests.length === 0) return null

  return (
    <GlassCard hover={false} className="p-5">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">
            Password reset requests
          </p>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Issue a temporary password. The user will be forced to replace it on login.
          </p>
        </div>
        <span className="font-mono text-xs text-[var(--color-text-muted)]">
          {requests.length} pending
        </span>
      </div>

      <div className="space-y-3">
        {requests.map((request) => {
          const requestedUser = Array.isArray(request.users) ? request.users[0] : request.users
          const isHighlighted = highlightedResetRequest === request.id

          return (
            <div
              key={request.id}
              className={`flex flex-col gap-3 rounded-xl border bg-[var(--color-surface)] p-4 sm:flex-row sm:items-center sm:justify-between ${
                isHighlighted ? 'border-[var(--color-accent-inti)]' : 'border-[var(--color-border)]'
              }`}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                    {requestedUser?.display_name ?? request.email}
                  </p>
                  {requestedUser?.role && (
                    <span className="rounded-md bg-[var(--color-surface-elevated)] px-2 py-0.5 text-[11px] font-bold tracking-wider text-[var(--color-text-muted)] uppercase">
                      {ROLE_LABELS[requestedUser.role] ?? requestedUser.role}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                  {requestedUser?.email ?? request.email} - requested{' '}
                  {formatCampusDateTime(request.created_at)}
                </p>
              </div>
              <PasswordResetRequestButton requestId={request.id} />
            </div>
          )
        })}
      </div>
    </GlassCard>
  )
}

function SuperAdminRoleFilterTabs({
  filterRole,
  roleCounts,
  allUsersTotal,
}: {
  filterRole?: string
  roleCounts: Record<string, number>
  allUsersTotal: number
}) {
  const tabs = [
    { key: '', label: `All (${allUsersTotal})` },
    ...SUPER_ADMIN_ROLE_KEYS.map((role) => ({
      key: role,
      label: `${ROLE_LABELS[role]} (${roleCounts[role] ?? 0})`,
    })),
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map(({ key, label }) => (
        <Link
          key={key}
          href={superAdminUsersHref({ role: key || undefined })}
          className={`inline-flex min-h-11 items-center rounded-lg px-4 text-sm font-medium transition-colors ${
            filterRole === key || (!filterRole && !key)
              ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)]'
              : 'bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          {label}
        </Link>
      ))}
    </div>
  )
}

function SuperAdminUsersEmptyState({ filterRole }: { filterRole?: string }) {
  return (
    <GlassCard hover={false} className="p-8">
      <output className="mx-auto block max-w-md text-center">
        <span className="block text-sm font-semibold text-[var(--color-text-primary)]">
          No users match this view
        </span>
        <span className="mt-1 block text-sm text-[var(--color-text-secondary)]">
          {filterRole
            ? `There are no ${ROLE_LABELS[filterRole] ?? filterRole} users on the platform.`
            : 'No synced users are available yet.'}
        </span>
        {filterRole && (
          <Link
            href="/super-admin/users"
            className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-[var(--color-surface-elevated)] px-4 text-xs font-semibold text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
          >
            Clear the role filter
          </Link>
        )}
      </output>
    </GlassCard>
  )
}

function SuperAdminUserEditPanel({
  user,
  role,
  assignableRoles,
}: {
  user: DbUser
  role: AppRole
  assignableRoles: AppRole[]
}) {
  return (
    <div className="space-y-4 border-t border-[var(--color-border)] px-5 pt-3 pb-4">
      <p className="text-xs font-medium tracking-wider text-[var(--color-text-secondary)] uppercase">
        Assign Role
      </p>
      <div className="flex flex-wrap gap-2">
        {assignableRoles.map((assignableRole) => (
          <form key={assignableRole} action={setRole.bind(null, user.id, assignableRole)}>
            <button
              type="submit"
              className={`min-h-11 rounded-xl px-4 text-xs font-semibold transition-colors ${
                role === assignableRole
                  ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)]'
                  : 'bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:bg-[var(--color-accent-surface)] hover:text-[var(--color-accent)]'
              }`}
            >
              {ROLE_LABELS[assignableRole]}{' '}
              <span className="font-mono opacity-50">L{superAdminRoleLevel(assignableRole)}</span>
            </button>
          </form>
        ))}
      </div>
      <form action={resetPassword.bind(null, user.id)} className="flex items-center gap-2">
        <input
          name="temp_password"
          type="password"
          aria-label={`New temporary password for ${user.display_name}`}
          required
          minLength={TEMPORARY_PASSWORD_MIN_LENGTH}
          placeholder={`At least ${TEMPORARY_PASSWORD_MIN_LENGTH} characters`}
          className="min-h-11 w-48 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 text-sm text-[var(--color-text-primary)] focus:ring-1 focus:ring-[var(--color-accent)] focus:outline-none"
        />
        <button
          type="submit"
          className="min-h-11 shrink-0 rounded-xl bg-[var(--color-status-submitted-bg)] px-4 text-xs font-semibold text-[var(--color-status-submitted-text)] transition-opacity hover:opacity-80"
        >
          Set Password
        </button>
      </form>
    </div>
  )
}

function SuperAdminUserDeletePanel({ user }: { user: DbUser }) {
  return (
    <div className="space-y-3 border-t border-[var(--color-border)] px-5 pt-3 pb-4">
      <p className="text-sm font-semibold text-[var(--color-status-rejected-text)]">
        Delete {user.display_name}?
      </p>
      <p className="text-xs text-[var(--color-text-secondary)]">
        This permanently removes their account and all associated data. This cannot be undone.
      </p>
      <form action={deleteUser.bind(null, user.id)}>
        <button
          type="submit"
          className="min-h-11 rounded-xl bg-[var(--color-status-rejected-text)] px-4 text-xs font-bold text-[var(--color-on-accent)] transition-opacity hover:opacity-80"
        >
          Yes, delete permanently
        </button>
      </form>
    </div>
  )
}

function SuperAdminUserCard({
  user,
  actor,
  currentUserId,
  base,
  separator,
  edit,
  confirm,
  assignableRoles,
}: {
  user: DbUser
  actor: ScopedUser
  currentUserId: string
  base: string
  separator: string
  edit?: string
  confirm?: string
  assignableRoles: AppRole[]
}) {
  const role = user.role as AppRole
  const isEditing = edit === user.id
  const isConfirming = confirm === user.id
  const canManage = canManageUser(actor, { id: user.id, role, orgIds: [] })

  return (
    <GlassCard
      data-testid="user-card"
      data-user-email={user.email}
      data-user-role={role}
      data-current-user={user.id === currentUserId ? 'true' : 'false'}
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
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-elevated)]">
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
              L{superAdminRoleLevel(role)}
            </span>
            {user.id === currentUserId && (
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
          {formatCampusShortDate(user.created_at)}
        </p>

        {canManage && !isEditing && !isConfirming && (
          <div className="flex shrink-0 gap-2">
            <Link
              href={`${base}${separator}edit=${user.id}`}
              className="inline-flex min-h-11 items-center rounded-lg bg-[var(--color-surface-elevated)] px-3 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
            >
              Edit
            </Link>
            <Link
              href={`${base}${separator}confirm=${user.id}`}
              className="inline-flex min-h-11 items-center rounded-lg bg-[var(--color-status-rejected-bg)] px-3 text-xs font-medium text-[var(--color-status-rejected-text)] transition-opacity hover:opacity-80"
            >
              Delete
            </Link>
          </div>
        )}

        {(isEditing || isConfirming) && (
          <Link
            href={base}
            className="inline-flex min-h-11 shrink-0 items-center rounded-lg bg-[var(--color-surface-elevated)] px-3 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
          >
            Cancel
          </Link>
        )}
      </div>

      {isEditing && canManage && (
        <SuperAdminUserEditPanel user={user} role={role} assignableRoles={assignableRoles} />
      )}
      {isConfirming && canManage && <SuperAdminUserDeletePanel user={user} />}
    </GlassCard>
  )
}

export default async function SuperAdminUsersPage({
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
    reset_request?: string
    page?: string
  }>
}) {
  const [
    {
      role: filterRole,
      msg,
      edit,
      confirm,
      add,
      err,
      error,
      reset_request: highlightedResetRequest,
      page,
    },
    access,
  ] = await Promise.all([searchParams, getCurrentAccessContext()])
  const isAdding = add === 'true'
  if (!access) redirect('/login')
  if (!canAccessSuperAdminArea(access.role)) redirect(getDefaultAppPath(access.role))

  const actor: ScopedUser = {
    id: access.userId,
    role: access.role,
    orgIds: access.orgIds,
  }
  const assignableRoles = getAssignableRoles(access.role)

  await syncAuthUsersToProfiles()

  const [usersPage, pendingResetRequests, roleCounts] = await Promise.all([
    getUsers({ role: filterRole, page }),
    getPendingPasswordResetRequests(),
    getSuperAdminUserRoleCounts(),
  ])
  const users = usersPage.items
  const allUsersTotal = Object.values(roleCounts).reduce((sum, count) => sum + count, 0)

  const base = superAdminUsersHref({ role: filterRole, page: usersPage.page })
  const separator = base.includes('?') ? '&' : '?'

  return (
    <DashboardBoardPage className="flex flex-col gap-5">
      <DashboardBoardHeader
        kicker="Super directory"
        title="Users"
        description={`${usersPage.total} users${
          filterRole ? ` · ${ROLE_LABELS[filterRole] ?? filterRole}` : ''
        } across super-admin, admin, and publisher access.`}
        action={{
          href: isAdding ? '/super-admin/users' : '/super-admin/users?add=true',
          label: isAdding ? 'Cancel' : 'Add user',
          icon: UserPlus,
          variant: isAdding ? 'secondary' : 'primary',
        }}
      />

      {isAdding && <SuperAdminNewUserForm err={err} assignableRoles={assignableRoles} />}

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

      <PasswordResetRequestsPanel
        requests={pendingResetRequests}
        highlightedResetRequest={highlightedResetRequest}
      />

      <SuperAdminRoleFilterTabs
        filterRole={filterRole}
        roleCounts={roleCounts}
        allUsersTotal={allUsersTotal}
      />

      <div className="space-y-2">
        {users.length === 0 && <SuperAdminUsersEmptyState filterRole={filterRole} />}
        {users.map((user) => (
          <SuperAdminUserCard
            key={user.id}
            user={user}
            actor={actor}
            currentUserId={access.userId}
            base={base}
            separator={separator}
            edit={edit}
            confirm={confirm}
            assignableRoles={assignableRoles}
          />
        ))}
      </div>
      <UserPagination page={usersPage.page} totalPages={usersPage.totalPages} role={filterRole} />
    </DashboardBoardPage>
  )
}
