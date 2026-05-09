import Link from 'next/link'
import { ArrowUpRight, KeyRound, Palette, UserRound } from 'lucide-react'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { GlassCard } from '@/components/dashboard/GlassCard'
import { updateAccountPassword, updateDisplayName } from '@/lib/account/actions'
import { getDefaultAppPath, type AccessContext } from '@/lib/auth/authz'

type SettingsVariant = 'publisher' | 'admin' | 'super_admin' | 'owner'

type SettingsSearch = {
  profile?: string
  password?: string
  error?: string
}

const SETTINGS_PATHS: Record<SettingsVariant, string> = {
  publisher: '/dashboard/settings',
  admin: '/admin/settings',
  super_admin: '/super-admin/settings',
  owner: '/owner/settings',
}

const WORKSPACE_LABELS: Record<string, string> = {
  owner: 'Owner',
  super_admin: 'Super Admin',
  admin: 'Admin',
  publisher: 'Publisher',
}

const WORKSPACES = [
  { role: 'owner', href: '/owner' },
  { role: 'super_admin', href: '/super-admin' },
  { role: 'admin', href: '/admin' },
  { role: 'publisher', href: '/dashboard' },
] as const

function canUseWorkspace(
  userRole: AccessContext['role'],
  workspaceRole: (typeof WORKSPACES)[number]['role']
) {
  if (userRole === 'owner') return true
  if (userRole === 'super_admin') return workspaceRole !== 'owner'
  if (userRole === 'admin') return workspaceRole === 'admin' || workspaceRole === 'publisher'
  return workspaceRole === 'publisher'
}

function StatusMessage({ search }: { search: SettingsSearch }) {
  const message = search.error ?? search.profile ?? search.password
  if (!message) return null

  const isError = Boolean(search.error)

  return (
    <div
      className={`rounded-xl px-4 py-3 text-sm ${
        isError
          ? 'bg-[var(--color-status-rejected-bg)] text-[var(--color-status-rejected-text)]'
          : 'bg-[var(--color-status-submitted-bg)] text-[var(--color-status-submitted-text)]'
      }`}
      role="status"
    >
      {message}
    </div>
  )
}

export function AccountSettingsPage({
  access,
  variant,
  search,
}: {
  access: AccessContext
  variant: SettingsVariant
  search: SettingsSearch
}) {
  const returnTo = SETTINGS_PATHS[variant]
  const roleHome = getDefaultAppPath(access.role)
  const workspaceLinks = WORKSPACES.filter((workspace) =>
    canUseWorkspace(access.role, workspace.role)
  )

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Settings
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">
            Manage your Bulletin identity, password, theme, and workspace shortcuts.
          </p>
        </div>
        <Link
          href={roleHome}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[var(--color-accent-inti)] px-4 text-sm font-semibold text-white transition-transform active:scale-[0.98]"
        >
          {WORKSPACE_LABELS[access.role]} home
          <ArrowUpRight size={15} aria-hidden="true" />
        </Link>
      </div>

      <StatusMessage search={search} />

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <GlassCard hover={false} className="p-5">
          <div className="mb-5 flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent-surface)] text-[var(--color-accent-inti)]">
              <UserRound size={18} aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Profile</h2>
              <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">
                This name appears in dashboards, audit trails, and announcement workflow screens.
              </p>
            </div>
          </div>

          <form action={updateDisplayName} className="space-y-4">
            <input type="hidden" name="return_to" value={returnTo} />
            <div className="space-y-1.5">
              <label
                htmlFor={`${variant}-display-name`}
                className="block text-sm font-medium text-[var(--color-text-secondary)]"
              >
                Display name
              </label>
              <input
                id={`${variant}-display-name`}
                name="display_name"
                type="text"
                required
                minLength={2}
                defaultValue={access.displayName ?? ''}
                className="input-inti w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="inline-flex min-h-10 items-center rounded-xl bg-[var(--color-accent-inti)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)]"
            >
              Save name
            </button>
          </form>
        </GlassCard>

        <GlassCard hover={false} className="p-5">
          <div className="mb-5 flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)]">
              <Palette size={18} aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                Appearance
              </h2>
              <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">
                Keep the dashboard comfortable for day or evening use.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
            <div>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">Theme</p>
              <p className="text-xs text-[var(--color-text-muted)]">
                Light, dark, or system preference
              </p>
            </div>
            <ThemeToggle />
          </div>
        </GlassCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <GlassCard hover={false} className="p-5">
          <div className="mb-5 flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-status-submitted-bg)] text-[var(--color-status-submitted-text)]">
              <KeyRound size={18} aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Password</h2>
              <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">
                Use this when you know your current password. Temporary passwords are changed at
                login.
              </p>
            </div>
          </div>

          <form action={updateAccountPassword} className="space-y-4">
            <input type="hidden" name="return_to" value={returnTo} />
            <div className="space-y-1.5">
              <label
                htmlFor={`${variant}-current-password`}
                className="block text-sm font-medium text-[var(--color-text-secondary)]"
              >
                Current password
              </label>
              <input
                id={`${variant}-current-password`}
                name="current_password"
                type="password"
                required
                autoComplete="current-password"
                className="input-inti w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] focus:outline-none"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label
                  htmlFor={`${variant}-new-password`}
                  className="block text-sm font-medium text-[var(--color-text-secondary)]"
                >
                  New password
                </label>
                <input
                  id={`${variant}-new-password`}
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="input-inti w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor={`${variant}-confirm-password`}
                  className="block text-sm font-medium text-[var(--color-text-secondary)]"
                >
                  Confirm password
                </label>
                <input
                  id={`${variant}-confirm-password`}
                  name="confirm"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="input-inti w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] focus:outline-none"
                />
              </div>
            </div>
            <button
              type="submit"
              className="inline-flex min-h-10 items-center rounded-xl bg-[var(--color-accent-inti)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)]"
            >
              Update password
            </button>
          </form>
        </GlassCard>

        <GlassCard hover={false} className="p-5">
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Workspaces</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">
            Jump between every dashboard your role can use.
          </p>
          <div className="mt-5 grid gap-2">
            {workspaceLinks.map((workspace) => (
              <Link
                key={workspace.href}
                href={workspace.href}
                className="flex min-h-11 items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm font-semibold text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
              >
                {WORKSPACE_LABELS[workspace.role]} workspace
                <ArrowUpRight size={15} aria-hidden="true" />
              </Link>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
