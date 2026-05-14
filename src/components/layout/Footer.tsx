import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { BrandMark } from './BrandMark'

const links = [
  { href: '/', label: 'Home' },
  { href: '/login', label: 'Staff sign in' },
  { href: 'https://newinti.edu.my', label: 'INTI website', external: true },
  { href: 'mailto:studentaffairs@newinti.edu.my', label: 'Student affairs', external: true },
]

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer
      className="mt-auto overflow-hidden"
      style={{
        borderTop: '1px solid var(--color-border)',
        background:
          'radial-gradient(circle at 18% 0%, color-mix(in oklab, var(--color-gold) 24%, transparent), transparent 24rem), linear-gradient(180deg,var(--color-surface-elevated),var(--color-surface))',
      }}
    >
      <div className="mx-auto grid w-full max-w-[1500px] gap-6 px-4 py-10 sm:px-6 sm:py-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)] lg:gap-8 lg:px-10 xl:px-12">
        <div className="flex flex-col gap-4">
          <BrandMark size="md" />
          <div>
            <p className="max-w-[38rem] text-base leading-7 text-[var(--color-text-muted)]">
              Official notices, events, deadlines, and student opportunities from INTI.
            </p>
            <p className="mt-2 font-mono text-[0.65rem] font-bold tracking-[0.16em] text-[var(--color-text-muted)] uppercase">
              © {year} INTI International University
            </p>
          </div>
        </div>

        <nav
          className="grid content-start gap-1.5 rounded-[1.25rem] border border-[var(--color-border)] bg-[var(--color-surface)]/86 p-1.5 shadow-[var(--shadow-soft)] sm:grid-cols-2"
          aria-label="Footer navigation"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex min-h-11 items-center justify-between gap-2 rounded-[0.875rem] px-3.5 py-2 text-sm font-semibold text-[var(--color-text-secondary)] transition-[background,color,transform] duration-300 ease-[var(--ease-ui)] hover:-translate-y-0.5 hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-inti)]"
              {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
              <span>{link.label}</span>
              {link.external && (
                <ArrowUpRight className="h-3.5 w-3.5 flex-shrink-0 opacity-50" aria-hidden="true" />
              )}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}
