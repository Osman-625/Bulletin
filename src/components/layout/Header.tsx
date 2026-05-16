import Link from 'next/link'
import { ThemeToggle } from './ThemeToggle'
import { BrandMark } from './BrandMark'
import { getCurrentAccessContext, getDefaultAppPath } from '@/lib/auth/authz'

function formatRole(role: string) {
  return role.replace('_', ' ')
}

export default async function Header() {
  const access = await getCurrentAccessContext()
  const workspaceHref = access ? getDefaultAppPath(access.role) : '/login'

  return (
    <header
      className="sticky top-0 z-50 shadow-[0_12px_36px_rgba(95,61,22,0.1),0_1px_0_rgba(30,26,23,0.05)] dark:shadow-[0_10px_36px_rgba(0,0,0,0.42),0_1px_0_rgba(255,255,255,0.04)]"
      style={{ borderBottom: '1px solid var(--color-border)' }}
    >
      <div className="loading-signal h-1.5 bg-[var(--color-accent-inti)]" />

      <div
        style={{
          background: 'var(--color-header-bg)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
        }}
      >
        <div className="mx-auto flex min-h-[6.25rem] w-full max-w-[1500px] items-center justify-between gap-3 px-4 py-3 sm:min-h-28 sm:gap-5 sm:px-6 lg:px-[18px] xl:px-[18px]">
          <Link
            href="/"
            className="group min-w-0 rounded-[1.5rem] pr-2 transition-transform duration-300 ease-[var(--ease-ui)] hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-inti)] sm:pr-3"
          >
            <BrandMark
              size="lg"
              preload
              className="transition-transform duration-300 ease-[var(--ease-ui)] group-hover:scale-[1.015]"
              textClassName="hidden min-[500px]:block"
            />
          </Link>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Link
              href={workspaceHref}
              className="inline-flex min-h-11 cursor-pointer items-center rounded-full px-4 font-sans text-sm font-semibold text-white transition-[transform,box-shadow,background] duration-300 ease-[var(--ease-ui)] hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-inti)] active:scale-[0.97] sm:min-h-12 sm:px-5 sm:text-base"
              style={{
                background: 'var(--color-accent-inti)',
                boxShadow:
                  '0 10px 28px color-mix(in oklab, var(--color-accent-inti) 24%, transparent)',
              }}
            >
              {access ? 'Workspace' : 'Sign in'}
            </Link>
          </div>
        </div>
      </div>
      {access && (
        <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)]/92 px-4 py-2.5 text-center text-xs font-medium text-[var(--color-text-muted)]">
          Public view as {formatRole(access.role)} ·{' '}
          <Link href={workspaceHref} className="text-[var(--color-accent-inti)] hover:underline">
            Back to workspace
          </Link>
        </div>
      )}
    </header>
  )
}
