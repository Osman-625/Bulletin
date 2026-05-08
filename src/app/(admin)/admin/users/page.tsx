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
import { getVisibleUsersForAdmin } from '@/lib/data'
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

async function getTargetUser(targetId: string): Promise<ScopedUser & { email: string; displayName: string }> {
  const supabase = await createServiceClient()
  const { data: target } = await supabase
    .from('users')
    .select('id, email, display_name, role, organization_members ( organization_id )')
    .eq('id', targetId)
    .single()

  if (!target) throw new Error('User not found')

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
  await supabase.from('users').update({ role: newRole as AppRole }).eq('id', userId)
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
  await supabase.auth.admin.updateUserById(userId, { password: temp })
  await supabase.from('users').update({ force_password_change: true }).eq('id', userId)
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
  await supabase.auth.admin.deleteUser(userId)
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
  searchParams: Promise<{ role?: string; msg?: string; edit?: string; confirm?: string }>
}) {
  const { role: filterRole, msg, edit, confirm } = await searchParams
  const access = await getCurrentAccessContext()
  if (!access) redirect('/login')
  if (!canAccessAdminArea(access.role)) redirect(getDefaultAppPath(access.role))

  const actor: ScopedUser = {
    id: access.userId,
    role: access.role,
    orgIds: access.orgIds,
  }

  const allUsers = await getVisibleUsersForAdmin()
  let users = allUsers
  if (filterRole && ROLE_LABELS[filterRole]) {
    users = users.filter((user) => user.role === filterRole)
  }

  const roleCounts = allUsers.reduce<Record<string, number>>((acc, user) => {
    acc[user.role as string] = (acc[user.role as string] ?? 0) + 1
    return acc
  }, {})

  const base = filterRole ? `/admin/users?role=${filterRole}` : '/admin/users'
  const separator = base.includes('?') ? '&' : '?'

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">Users</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            {users.length} users{filterRole ? ` - ${ROLE_LABELS[filterRole] ?? filterRole}` : ''}
          </p>
        </div>
        <Link
          href="/admin/publishers/invite"
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--color-accent)] text-white hover:opacity-90 transition-opacity shrink-0"
        >
          Invite Publisher
        </Link>
      </div>

      {msg && (
        <div className="px-4 py-3 rounded-xl bg-[var(--color-status-submitted-bg)] text-[var(--color-status-submitted-text)] text-sm font-mono">
          {msg}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {[
          { key: '', label: `All (${allUsers.length})` },
          ...Object.keys(ROLE_LABELS).map((role) => ({
            key: role,
            label: `${ROLE_LABELS[role]} (${roleCounts[role] ?? 0})`,
          })),
        ].map(({ key, label }) => (
          <a
            key={key}
            href={key ? `/admin/users?role=${key}` : '/admin/users'}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
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
        {users.map((user) => {
          const role = user.role as AppRole
          const isEditing = edit === user.id
          const isConfirming = confirm === user.id
          const target: ScopedUser = {
            id: user.id,
            role,
            orgIds: (user.organization_members ?? []).map((membership: { organization_id: string }) => membership.organization_id),
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
              <div className="px-5 py-4 flex items-center gap-4">
                <div className="h-9 w-9 rounded-full bg-[var(--color-surface-elevated)] flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-[var(--color-text-secondary)]">
                    {user.display_name.charAt(0).toUpperCase()}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">{user.display_name}</p>
                    <span className="text-[15px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)]">
                      {ROLE_LABELS[role] ?? role}
                    </span>
                    <span
                      className="text-[15px] font-mono font-bold px-1.5 py-0.5 rounded bg-[var(--color-surface-elevated)]"
                      style={{ color: LEVEL_COLOR[role] ?? 'var(--color-text-muted)' }}
                    >
                      L{role === 'admin' ? 2 : 3}
                    </span>
                    {user.id === access.userId && (
                      <span className="text-[15px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--color-accent-surface)] text-[var(--color-accent)]">
                        You
                      </span>
                    )}
                    {user.force_password_change && (
                      <span className="text-[15px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--color-status-submitted-bg)] text-[var(--color-status-submitted-text)]">
                        Must change pw
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{user.email}</p>
                </div>

                <p className="text-xs font-mono text-[var(--color-text-muted)] shrink-0 hidden sm:block">
                  {new Date(user.created_at).toLocaleDateString('en-MY', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>

                {canManage && !isEditing && !isConfirming && (
                  <div className="flex gap-2 shrink-0">
                    <a
                      href={`${base}${separator}edit=${user.id}`}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                    >
                      Edit
                    </a>
                    <a
                      href={`${base}${separator}confirm=${user.id}`}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--color-status-rejected-bg)] text-[var(--color-status-rejected-text)] hover:opacity-80 transition-opacity"
                    >
                      Delete
                    </a>
                  </div>
                )}

                {(isEditing || isConfirming) && (
                  <a
                    href={base}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors shrink-0"
                  >
                    Cancel
                  </a>
                )}
              </div>

              {isEditing && canManage && (
                <div className="px-5 pb-4 pt-3 border-t border-[var(--color-border)] space-y-4">
                  <p className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Publisher Controls</p>
                  <form action={setRole.bind(null, user.id, 'publisher')}>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--color-accent)] text-white"
                    >
                      Keep as Publisher <span className="opacity-60 font-mono">L3</span>
                    </button>
                  </form>
                  <form action={resetPassword.bind(null, user.id)} className="flex gap-2 items-center">
                    <input
                      name="temp_password"
                      type="password"
                      required
                      minLength={8}
                      placeholder="New temp password"
                      className="px-3 py-2 rounded-lg text-sm bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] border border-[var(--color-border)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] w-48"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--color-status-submitted-bg)] text-[var(--color-status-submitted-text)] hover:opacity-80 transition-opacity shrink-0"
                    >
                      Set Password
                    </button>
                  </form>
                </div>
              )}

              {isConfirming && canManage && (
                <div className="px-5 pb-4 pt-3 border-t border-[var(--color-border)] space-y-3">
                  <p className="text-sm font-semibold text-[var(--color-status-rejected-text)]">
                    Delete {user.display_name}?
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    This permanently removes their account and all associated data. This cannot be undone.
                  </p>
                  <form action={deleteUser.bind(null, user.id)}>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--color-status-rejected-text)] text-white hover:opacity-80 transition-opacity"
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
    </div>
  )
}
