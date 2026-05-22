import Link from 'next/link'
import { BrandMark } from './BrandMark'

const links = [
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
  { href: 'mailto:studentaffairs@newinti.edu.my', label: 'Contact' },
]

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer
      className="mt-auto"
      style={{
        borderTop: '1px solid var(--color-border-subtle)',
        background: 'var(--color-surface)',
      }}
    >
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-5 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <BrandMark size="sm" showText={false} />
          <div className="min-w-0">
            <p className="font-mono text-[0.68rem] font-bold tracking-[0.16em] text-[var(--color-text-primary)] uppercase">
              Bulletin · © {year} Bulletin
            </p>
            <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
              Campus notices and student opportunities for the INTI community.
            </p>
          </div>
        </div>

        <nav
          className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[0.68rem] font-bold tracking-[0.14em] text-[var(--color-text-muted)] uppercase"
          aria-label="Footer navigation"
        >
          {links.map((link) =>
            link.href.startsWith('mailto:') ? (
              <a
                key={link.href}
                href={link.href}
                className="rounded-md transition-colors duration-200 hover:text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-inti)]"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md transition-colors duration-200 hover:text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-inti)]"
              >
                {link.label}
              </Link>
            )
          )}
        </nav>
      </div>
    </footer>
  )
}
