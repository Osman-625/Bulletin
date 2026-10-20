import Link from 'next/link'
import { GlassCard } from '@/components/dashboard/GlassCard'
import { ROLE_LEVEL, type AppRole } from '@/modules/auth/authz'
import { TEMPORARY_PASSWORD_MIN_LENGTH } from '@/modules/auth/password-policy'
import { usersHref } from '@/modules/users/users-href'

type UserSummary = { id: string; display_name: string }
type RoleLabels = Record<string, string>

function userFormError(error: string) {
  if (error === 'missing_fields') return 'All fields are required.'
  if (error === 'invalid_role') return 'That role is not allowed from this screen.'
  return error
}

export function NewUserForm({
  idPrefix,
  err,
  assignableRoles,
  roleLabels,
  createAction,
}: {
  idPrefix: string
  err?: string
  assignableRoles: AppRole[]
  roleLabels: RoleLabels
  createAction: (formData: FormData) => Promise<void>
}) {
  const fieldClass =
    'w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:ring-1 focus:ring-[var(--color-accent)] focus:outline-none'
  const labelClass = 'mb-1 block text-xs font-medium text-[var(--color-text-secondary)]'

  return (
    <GlassCard hover={false} className="p-6">
      <p className="mb-4 text-sm font-semibold text-[var(--color-text-primary)]">New User</p>
      {err && (
        <p className="mb-3 text-xs text-[var(--color-status-rejected-text)]">
          {userFormError(err)}
        </p>
      )}
      <form action={createAction} className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor={`${idPrefix}-display-name`} className={labelClass}>
              Username *
            </label>
            <input
              id={`${idPrefix}-display-name`}
              name="display_name"
              aria-label="Username"
              required
              placeholder="john_doe"
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor={`${idPrefix}-email`} className={labelClass}>
              Email <span className="opacity-50">(optional)</span>
            </label>
            <input
              id={`${idPrefix}-email`}
              name="email"
              aria-label="Email (optional)"
              type="email"
              placeholder="user@inti.edu.my"
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor={`${idPrefix}-password`} className={labelClass}>
              Temporary password *
            </label>
            <input
              id={`${idPrefix}-password`}
              name="password"
              aria-label="Temporary password"
              type="password"
              required
              minLength={TEMPORARY_PASSWORD_MIN_LENGTH}
              placeholder={`At least ${TEMPORARY_PASSWORD_MIN_LENGTH} characters`}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor={`${idPrefix}-role`} className={labelClass}>
              Role *
            </label>
            <select id={`${idPrefix}-role`} name="role" required className={fieldClass}>
              {assignableRoles.map((role) => (
                <option key={role} value={role}>
                  {roleLabels[role]} (L{ROLE_LEVEL[role]})
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

export function UserRoleFilterTabs({
  basePath,
  roleLabels,
  filterRole,
  roleCounts,
  allUsersTotal,
}: {
  basePath: string
  roleLabels: RoleLabels
  filterRole?: string
  roleCounts: Record<string, number>
  allUsersTotal: number
}) {
  const tabs = [
    { key: '', label: `All (${allUsersTotal})` },
    ...Object.keys(roleLabels).map((role) => ({
      key: role,
      label: `${roleLabels[role]} (${roleCounts[role] ?? 0})`,
    })),
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map(({ key, label }) => (
        <Link
          key={key}
          href={usersHref(basePath, { role: key || undefined })}
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

export function UsersEmptyState({
  basePath,
  roleLabels,
  filterRole,
  scopeLabel,
  emptyMessage,
}: {
  basePath: string
  roleLabels: RoleLabels
  filterRole?: string
  scopeLabel: string
  emptyMessage: string
}) {
  return (
    <GlassCard hover={false} className="p-8">
      <output className="mx-auto block max-w-md text-center">
        <span className="block text-sm font-semibold text-[var(--color-text-primary)]">
          No users match this view
        </span>
        <span className="mt-1 block text-sm text-[var(--color-text-secondary)]">
          {filterRole
            ? `There are no ${roleLabels[filterRole] ?? filterRole} users ${scopeLabel}.`
            : emptyMessage}
        </span>
        {filterRole && (
          <Link
            href={basePath}
            className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-[var(--color-surface-elevated)] px-4 text-xs font-semibold text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
          >
            Clear the role filter
          </Link>
        )}
      </output>
    </GlassCard>
  )
}

export function UserEditPanel({
  user,
  role,
  assignableRoles,
  roleLabels,
  setRoleAction,
  resetPasswordAction,
}: {
  user: UserSummary
  role: AppRole
  assignableRoles: AppRole[]
  roleLabels: RoleLabels
  setRoleAction: (userId: string, role: string) => Promise<void>
  resetPasswordAction: (userId: string, formData: FormData) => Promise<void>
}) {
  return (
    <div className="space-y-4 border-t border-[var(--color-border)] px-5 pt-3 pb-4">
      <p className="text-xs font-medium tracking-wider text-[var(--color-text-secondary)] uppercase">
        Assign Role
      </p>
      <div className="flex flex-wrap gap-2">
        {assignableRoles.map((assignableRole) => (
          <form key={assignableRole} action={setRoleAction.bind(null, user.id, assignableRole)}>
            <button
              type="submit"
              className={`min-h-11 rounded-xl px-4 text-xs font-semibold transition-colors ${
                role === assignableRole
                  ? 'bg-[var(--color-accent)] text-[var(--color-on-accent)]'
                  : 'bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:bg-[var(--color-accent-surface)] hover:text-[var(--color-accent)]'
              }`}
            >
              {roleLabels[assignableRole]}{' '}
              <span className="font-mono opacity-50">L{ROLE_LEVEL[assignableRole]}</span>
            </button>
          </form>
        ))}
      </div>
      <form action={resetPasswordAction.bind(null, user.id)} className="flex items-center gap-2">
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

export function UserDeletePanel({
  user,
  deleteAction,
}: {
  user: UserSummary
  deleteAction: (userId: string) => Promise<void>
}) {
  return (
    <div className="space-y-3 border-t border-[var(--color-border)] px-5 pt-3 pb-4">
      <p className="text-sm font-semibold text-[var(--color-status-rejected-text)]">
        Delete {user.display_name}?
      </p>
      <p className="text-xs text-[var(--color-text-secondary)]">
        This permanently removes their account and all associated data. This cannot be undone.
      </p>
      <form action={deleteAction.bind(null, user.id)}>
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
