import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { GlassCard } from '@/components/dashboard/GlassCard'
import { createServiceClient } from '@/lib/supabase/server'

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

const ASSIGNABLE: UserRole[] = ['super_admin', 'admin', 'publisher']

async function createUser(formData: FormData) {
  'use server'
  const supabase = await createServiceClient()
  const displayName = (formData.get('display_name') as string).trim()
  const rawEmail = (formData.get('email') as string).trim()
  const email = rawEmail || `${displayName.toLowerCase().replace(/\s+/g, '_')}@bulletin.internal`
  const password = formData.get('password') as string
  const role = formData.get('role') as string
  if (!displayName || !password || !role) redirect('/owner/users?add=true&err=missing_fields')
  const { data: authData, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  })
  if (error || !authData.user) redirect(`/owner/users?add=true&err=${encodeURIComponent(error?.message ?? 'Failed')}`)
  await supabase.from('users').update({ role, display_name: displayName }).eq('id', authData.user.id)
  redirect('/owner/users')
}

async function setRole(userId: string, newRole: string) {
  'use server'
  const supabase = await createServiceClient()
  const { data: target } = await supabase.from('users').select('role').eq('id', userId).single()
  if (!target || target.role === 'owner') return
  await supabase.from('users').update({ role: newRole }).eq('id', userId)
  revalidatePath('/owner/users')
}

async function resetPassword(userId: string, displayName: string) {
  'use server'
  const supabase = await createServiceClient()
  const { data: target } = await supabase.from('users').select('role').eq('id', userId).single()
  if (!target || target.role === 'owner') return
  const temp = `Bulletin${Math.random().toString(36).slice(2, 8).toUpperCase()}!`
  await supabase.auth.admin.updateUserById(userId, { password: temp })
  await supabase.from('users').update({ force_password_change: true }).eq('id', userId)
  redirect(`/owner/users?msg=${encodeURIComponent(`Temp password for ${displayName}: ${temp}`)}`)
}

async function deleteUser(userId: string) {
  'use server'
  const supabase = await createServiceClient()
  const { data: target } = await supabase.from('users').select('role').eq('id', userId).single()
  if (!target || target.role === 'owner') return
  await supabase.auth.admin.deleteUser(userId)
  revalidatePath('/owner/users')
}

export default async function OwnerUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; msg?: string; edit?: string; confirm?: string; add?: string; err?: string }>
}) {
  const { role: filterRole, msg, edit, confirm, add, err } = await searchParams
  const isAdding = add === 'true'
  const supabase = await createServiceClient()
  const { data: meData } = await supabase.auth.getUser()
  const myId = meData.user?.id

  let query = supabase.from('users').select('*').order('created_at', { ascending: false })
  if (filterRole && ROLE_LABELS[filterRole]) query = query.eq('role', filterRole)
  const { data: users } = await query
  const { data: allUsers } = await supabase.from('users').select('role')

  const roleCounts = (allUsers ?? []).reduce<Record<string, number>>((acc, u) => {
    acc[u.role as string] = (acc[u.role as string] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">All Users</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            {users?.length ?? 0} users{filterRole ? ` · ${ROLE_LABELS[filterRole] ?? filterRole}` : ''}
          </p>
        </div>
        <a
          href={isAdding ? '/owner/users' : '/owner/users?add=true'}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 ${isAdding ? 'bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)]' : 'bg-[var(--color-accent)] text-white hover:opacity-90'}`}
        >
          {isAdding ? 'Cancel' : '+ Add User'}
        </a>
      </div>

      {isAdding && (
        <GlassCard hover={false} className="p-6">
          <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">New User</p>
          {err && <p className="text-xs text-[var(--color-status-rejected-text)] mb-3">{err === 'missing_fields' ? 'All fields are required.' : err}</p>}
          <form action={createUser} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Username *</label>
                <input name="display_name" required placeholder="john_doe" className="w-full px-3 py-2 rounded-lg text-sm bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] border border-[var(--color-border)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Email <span className="opacity-50">(optional)</span></label>
                <input name="email" type="email" placeholder="user@inti.edu.my" className="w-full px-3 py-2 rounded-lg text-sm bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] border border-[var(--color-border)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Password *</label>
                <input name="password" type="password" required placeholder="Temp password" className="w-full px-3 py-2 rounded-lg text-sm bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] border border-[var(--color-border)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Role *</label>
                <select name="role" required className="w-full px-3 py-2 rounded-lg text-sm bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] border border-[var(--color-border)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]">
                  {ASSIGNABLE.map((r) => (
                    <option key={r} value={r}>{ROLE_LABELS[r]} (L{PRIVILEGE[r]})</option>
                  ))}
                </select>
              </div>
            </div>
            <button type="submit" className="px-5 py-2 rounded-xl text-xs font-bold bg-[var(--color-accent)] text-white hover:opacity-90 transition-opacity">
              Create User
            </button>
          </form>
        </GlassCard>
      )}

      {msg && (
        <div className="px-4 py-3 rounded-xl bg-[var(--color-status-submitted-bg)] text-[var(--color-status-submitted-text)] text-sm font-mono">
          {msg}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {[
          { key: '', label: `All (${allUsers?.length ?? 0})` },
          ...Object.keys(ROLE_LABELS).map((r) => ({ key: r, label: `${ROLE_LABELS[r]} (${roleCounts[r] ?? 0})` })),
        ].map(({ key, label }) => (
          <a
            key={key}
            href={key ? `/owner/users?role=${key}` : '/owner/users'}
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
        {(users ?? []).map((u) => {
          const isMe = u.id === myId
          const role = u.role as UserRole
          const level = PRIVILEGE[role] ?? 3
          const isEditing = edit === u.id
          const isConfirming = confirm === u.id
          const canManage = !isMe && role !== 'owner'
          const base = filterRole ? `/owner/users?role=${filterRole}` : '/owner/users'

          return (
            <GlassCard
              key={u.id}
              hover={false}
              className={isConfirming ? 'ring-1 ring-[var(--color-status-rejected-text)]' : isEditing ? 'ring-1 ring-[var(--color-accent)]' : ''}
            >
              <div className="px-5 py-4 flex items-center gap-4">
                <div className="h-9 w-9 rounded-full bg-[var(--color-surface-elevated)] flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-[var(--color-text-secondary)]">
                    {u.display_name.charAt(0).toUpperCase()}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">{u.display_name}</p>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)]">
                      {ROLE_LABELS[role] ?? role}
                    </span>
                    <span
                      className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[var(--color-surface-elevated)]"
                      style={{ color: LEVEL_COLOR[level] }}
                    >
                      L{level}
                    </span>
                    {isMe && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--color-accent-surface)] text-[var(--color-accent)]">
                        You
                      </span>
                    )}
                    {u.force_password_change && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--color-status-submitted-bg)] text-[var(--color-status-submitted-text)]">
                        Must change pw
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{u.email}</p>
                </div>

                <p className="text-xs font-mono text-[var(--color-text-muted)] shrink-0 hidden sm:block">
                  {new Date(u.created_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>

                {canManage && !isEditing && !isConfirming && (
                  <div className="flex gap-2 shrink-0">
                    <a
                      href={`${base}&edit=${u.id}`}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                    >
                      Edit
                    </a>
                    <a
                      href={`${base}&confirm=${u.id}`}
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

              {isEditing && (
                <div className="px-5 pb-4 pt-3 border-t border-[var(--color-border)] space-y-4">
                  <p className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Assign Role</p>
                  <div className="flex flex-wrap gap-2">
                    {ASSIGNABLE.map((r) => (
                      <form key={r} action={setRole.bind(null, u.id, r)}>
                        <button
                          type="submit"
                          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                            role === r
                              ? 'bg-[var(--color-accent)] text-white'
                              : 'bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:bg-[var(--color-accent-surface)] hover:text-[var(--color-accent)]'
                          }`}
                        >
                          {ROLE_LABELS[r]}{' '}
                          <span className="opacity-50 font-mono">L{PRIVILEGE[r]}</span>
                        </button>
                      </form>
                    ))}
                  </div>
                  <form action={resetPassword.bind(null, u.id, u.display_name)}>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--color-status-submitted-bg)] text-[var(--color-status-submitted-text)] hover:opacity-80 transition-opacity"
                    >
                      Reset Password
                    </button>
                  </form>
                </div>
              )}

              {isConfirming && (
                <div className="px-5 pb-4 pt-3 border-t border-[var(--color-border)] space-y-3">
                  <p className="text-sm font-semibold text-[var(--color-status-rejected-text)]">
                    Delete {u.display_name}?
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    This permanently removes their account and all associated data. This cannot be undone.
                  </p>
                  <form action={deleteUser.bind(null, u.id)}>
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
