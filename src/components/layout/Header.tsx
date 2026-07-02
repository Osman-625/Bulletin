import Link from 'next/link'
import { ThemeToggle } from './ThemeToggle'
import { BrandMark } from './BrandMark'
import { HeaderLoadingSignal } from './HeaderLoadingSignal'
import { getDefaultAppPath, type AccessContext } from '@/modules/auth/authz'
import { formatCampusLongDate } from '@/modules/announcements/public-board'

function formatRole(role: string) {
  return role.replaceAll('_', ' ')
}

export default async function Header({ access }: { access: AccessContext | null }) {
  const workspaceHref = access ? getDefaultAppPath(access.role) : '/login'
  const today = formatCampusLongDate()

  return (
    <header className="relative z-[70] overflow-visible border-b border-[var(--color-border-subtle)] bg-[var(--color-header-bg)] shadow-[var(--shadow-header)]">
      <HeaderLoadingSignal />
      <div aria-hidden="true" className="flex h-[3px]">
        <span className="flex-1 bg-[var(--color-accent-inti)]" />
        <span className="flex-1 bg-[var(--color-gold)]" />
        <span className="flex-1 bg-[var(--color-accent-inti)]" />
      </div>

      <div className="bg-[var(--color-header-bg)] backdrop-blur-[18px]">
        <nav
          aria-label="Public navigation"
          className="public-layout-inner public-chrome-inner flex min-h-16 items-center justify-between gap-2 py-2 sm:gap-4"
        >
          <Link
            href="/"
            className="group min-w-0 rounded-[1rem] pr-2 transition-transform duration-300 ease-[var(--ease-ui)] hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-inti)] sm:pr-3"
          >
            <BrandMark
              size="md"
              preload
              className="gap-2 transition-transform duration-300 ease-[var(--ease-ui)] group-hover:scale-[1.015] sm:gap-3"
              textClassName="block max-w-[8.5rem] [&_p:first-child]:font-display [&_p:first-child]:text-lg [&_p:first-child]:font-extrabold [&_p:last-child]:hidden sm:[&_p:last-child]:block"
            />
          </Link>

          <div className="hidden min-w-0 flex-1 justify-center md:flex">
            <p className="max-w-full truncate rounded-[7px] border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/70 px-3.5 py-1.5 font-mono text-[0.66rem] font-bold tracking-[0.14em] text-[var(--color-text-muted)] uppercase">
              {today}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Link
              href={workspaceHref}
              className={
                access
                  ? 'inline-flex min-h-11 cursor-pointer items-center rounded-[10px] border border-transparent px-3 font-sans text-sm font-semibold text-[var(--color-text-primary)] transition-[transform,background,border-color,color] duration-300 ease-[var(--ease-ui)] hover:-translate-y-0.5 hover:border-[var(--color-border)] hover:bg-[var(--color-surface)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-inti)] active:scale-[0.97] sm:px-4'
                  : 'inline-flex min-h-11 cursor-pointer items-center rounded-[10px] bg-[var(--color-accent-inti)] px-4 font-sans text-sm font-semibold text-[var(--color-on-accent)] transition-[transform,background,box-shadow] duration-300 ease-[var(--ease-ui)] hover:-translate-y-0.5 hover:bg-[var(--color-accent-hover)] hover:shadow-[var(--shadow-button-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-inti)] active:scale-[0.97] sm:px-5'
              }
            >
              {access ? 'Workspace' : 'Sign in'}
            </Link>
          </div>
        </nav>
      </div>
      {access && (
        <div className="min-h-[var(--public-owner-bar-height)] border-t border-[var(--color-border)] bg-[var(--color-surface)] text-center text-xs font-medium text-[var(--color-text-muted)]">
          <div className="public-layout-inner public-chrome-inner flex min-h-[var(--public-owner-bar-height)] flex-wrap items-center justify-center gap-x-1.5 gap-y-1 py-2">
            <span>Public view as {formatRole(access.role)}</span>
            <span aria-hidden="true">·</span>
            <Link href={workspaceHref} className="text-[var(--color-accent-inti)] hover:underline">
              Back to workspace
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
