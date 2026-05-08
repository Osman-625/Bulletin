import Link from 'next/link'
import Image from 'next/image'
import { ThemeToggle } from './ThemeToggle'
import { getCurrentAccessContext, getDefaultAppPath } from '@/lib/auth/authz'

function formatRole(role: string) {
  return role.replace('_', ' ')
}

export default async function Header() {
  const access = await getCurrentAccessContext()
  const workspaceHref = access ? getDefaultAppPath(access.role) : '/login'

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      {/* INTI red top stripe */}
      <div className="h-[5px]" style={{ background: 'var(--color-accent-inti)' }} />

      {/* Nav bar — frosted glass */}
      <div
        style={{
          background: 'var(--color-header-bg)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
        }}
      >
        <div className="mx-auto flex h-16 w-full max-w-[90rem] items-center justify-between gap-3 px-4 sm:h-20 sm:gap-5 sm:px-6 lg:px-10 xl:px-12">

          <Link
            href="/"
            className="group flex min-w-0 items-center gap-2 rounded-full pr-2 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-inti)] sm:gap-3 sm:pr-3"
          >
            <div className="flex-shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105">
              <Image
                src="/bulletin_logo.png"
                alt="Bulletin"
                width={128}
                height={128}
                className="h-8 w-8 object-contain sm:h-10 sm:w-10 lg:h-11 lg:w-11"
                priority
              />
            </div>

            <div className="min-w-0">
              <div
                className="font-display text-2xl font-bold leading-none transition-colors duration-300 sm:text-3xl lg:text-4xl"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Bulletin
              </div>
              <div
                className="mt-1 hidden max-w-[13rem] truncate text-xs font-semibold uppercase leading-none tracking-[0.2em] sm:block sm:max-w-none"
                style={{ color: 'var(--color-text-muted)' }}
              >
                INTI International University
              </div>
            </div>
          </Link>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Link
              href={workspaceHref}
              className="inline-flex min-h-10 cursor-pointer items-center rounded-full px-3 font-sans text-sm font-semibold text-white transition-[transform,box-shadow,background] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-inti)] active:scale-[0.97] sm:min-h-11 sm:px-5 sm:text-base"
              style={{
                background: 'var(--color-accent-inti)',
                boxShadow: '0 10px 28px color-mix(in oklab, var(--color-accent-inti) 24%, transparent)',
              }}
            >
              {access ? 'Workspace' : 'Sign in'}
            </Link>
          </div>
        </div>
      </div>
      {access && (
        <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)]/90 px-4 py-2 text-center text-xs font-medium text-[var(--color-text-muted)]">
          Public view as {formatRole(access.role)} ·{' '}
          <Link href={workspaceHref} className="text-[var(--color-accent-inti)] hover:underline">
            Back to workspace
          </Link>
        </div>
      )}
    </header>
  )
}
