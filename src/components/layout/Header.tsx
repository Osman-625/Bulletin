import Link from 'next/link'
import Image from 'next/image'
import { ThemeToggle } from './ThemeToggle'

export default function Header() {
  return (
    <header
      className="sticky top-0 z-50"
      style={{
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      {/* INTI red top stripe */}
      <div className="h-[3px]" style={{ background: 'var(--color-accent-inti)' }} />

      {/* Nav bar — frosted glass */}
      <div
        style={{
          background: 'var(--color-header-bg)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
        }}
      >
        <div className="mx-auto flex h-[62px] max-w-5xl items-center justify-between px-4 sm:px-6">

          {/* Wordmark */}
          <Link href="/" className="group flex items-center gap-3 focus:outline-none">
            {/* Logo mark */}
            <div className="flex-shrink-0 transition-transform duration-200 group-hover:scale-105">
              <Image
                src="/bulletin_logo.png"
                alt="Bulletin"
                width={40}
                height={40}
                className="h-10 w-10 object-contain"
                priority
              />
            </div>

            {/* Text */}
            <div>
              <div
                className="font-display font-bold leading-none transition-colors duration-200"
                style={{ fontSize: 19, color: 'var(--color-text-primary)' }}
              >
                Bulletin
              </div>
              <div
                className="mt-[3px] text-[8.5px] font-medium tracking-[0.28em] uppercase leading-none"
                style={{ color: 'var(--color-text-muted)' }}
              >
                INTI International University
              </div>
            </div>
          </Link>

          {/* Right actions */}
          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            <Link
              href="/login"
              className="inline-flex cursor-pointer items-center rounded-[10px] px-4 py-[9px] font-sans text-[13px] font-semibold text-white focus:outline-none focus-visible:ring-2 active:scale-[0.97]"
              style={{
                background: 'var(--color-accent-inti)',
                boxShadow: '0 1px 4px rgba(200, 16, 46, 0.25)',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
