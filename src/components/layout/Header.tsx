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
      <div className="h-[5px]" style={{ background: 'var(--color-accent-inti)' }} />

      {/* Nav bar — frosted glass */}
      <div
        style={{
          background: 'var(--color-header-bg)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
        }}
      >
        <div className="mx-auto flex h-[147px] w-full max-w-[169rem] items-center justify-between px-4 sm:h-[162px] sm:px-6 lg:px-10 xl:px-12">

          {/* Wordmark */}
          <Link
            href="/"
            className="group flex items-center gap-6 rounded-full pr-3 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-inti)]"
          >
            {/* Logo mark */}
            <div className="flex-shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105">
              <Image
                src="/bulletin_logo.png"
                alt="Bulletin"
                width={128}
                height={128}
                className="h-[105px] w-[105px] object-contain sm:h-[128px] sm:w-[128px]"
                priority
              />
            </div>

            {/* Text */}
            <div>
              <div
                className="font-display font-bold leading-none tracking-tight transition-colors duration-300"
                style={{ fontSize: 'clamp(4.365rem, 5.625vw, 5.49rem)', color: 'var(--color-text-primary)' }}
              >
                Bulletin
              </div>
              <div
                className="mt-2.5 text-[22.5px] font-semibold uppercase leading-none tracking-[0.24em] sm:text-[27px]"
                style={{ color: 'var(--color-text-muted)' }}
              >
                INTI International University
              </div>
            </div>
          </Link>

          {/* Right actions */}
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link
              href="/login"
              className="inline-flex min-h-[4.5rem] cursor-pointer items-center rounded-full px-8 font-sans text-[31.5px] font-semibold text-white transition-[transform,box-shadow,background] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-inti)] active:scale-[0.97] sm:px-9"
              style={{
                background: 'var(--color-accent-inti)',
                boxShadow: '0 10px 28px color-mix(in oklab, var(--color-accent-inti) 24%, transparent)',
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
