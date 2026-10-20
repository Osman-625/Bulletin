import Image from 'next/image'
import Link from 'next/link'

import { cn } from '@/shared/utils'

type BrandMarkSize = 'sm' | 'md' | 'lg' | 'xl' | 'hero'

type BrandMarkProps = {
  asLink?: boolean
  className?: string
  href?: string
  preload?: boolean
  showText?: boolean
  size?: BrandMarkSize
  tagline?: string
  textClassName?: string
}

const shellSizes: Record<BrandMarkSize, string> = {
  sm: 'h-9 w-9 rounded-[0.85rem]',
  md: 'h-14 w-14 rounded-[1.25rem]',
  lg: 'h-[4.5rem] w-[4.5rem] rounded-[1.5rem]',
  xl: 'h-20 w-20 rounded-[1.75rem] sm:h-24 sm:w-24 sm:rounded-[2rem]',
  hero: 'h-28 w-28 rounded-[2rem] sm:h-32 sm:w-32 md:h-40 md:w-40 md:rounded-[2.5rem]',
}

const imageWidths: Record<BrandMarkSize, number> = {
  sm: 30,
  md: 46,
  lg: 60,
  xl: 78,
  hero: 124,
}

const textSizes: Record<BrandMarkSize, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  hero: 'text-2xl sm:text-3xl',
}

export function BrandMark({
  asLink = false,
  className,
  href = '/',
  preload = false,
  showText = true,
  size = 'md',
  tagline = 'Independent campus board',
  textClassName,
}: BrandMarkProps) {
  const imageWidth = imageWidths[size]

  const mark = (
    <div
      className={cn(
        'group flex items-center gap-3 text-left',
        showText && size !== 'sm' ? 'min-w-0' : '',
        className
      )}
    >
      <div
        className={cn(
          'relative isolate grid shrink-0 place-items-center overflow-hidden border border-[var(--color-mark-plate-border)] bg-[var(--color-mark-plate)] shadow-[var(--shadow-mark)]',
          shellSizes[size]
        )}
      >
        <span
          aria-hidden="true"
          className="absolute inset-[14%] z-0 rounded-full bg-[var(--color-mark-glow)] blur-xl"
        />
        <span
          aria-hidden="true"
          className="absolute inset-[9%] z-0 rounded-[inherit] border border-[var(--color-mark-plate-ring)]"
        />
        <Image
          src="/bulletin_logo.png"
          alt="Bulletin logo"
          width={imageWidth}
          height={imageWidth}
          preload={preload}
          sizes={`${imageWidth}px`}
          className="relative z-10 h-auto w-[82%] object-contain drop-shadow-[var(--shadow-logo-mark)]"
        />
      </div>

      {showText ? (
        <div className={cn('max-w-[13rem] min-w-0', textClassName)}>
          <p
            className={cn(
              'font-display leading-none font-extrabold text-[var(--color-text-primary)]',
              textSizes[size]
            )}
          >
            Bulletin
          </p>
          <p className="mt-1 font-mono text-[0.65rem] font-bold tracking-[0.16em] text-[var(--color-accent-inti)] uppercase">
            {tagline}
          </p>
        </div>
      ) : null}
    </div>
  )

  if (!asLink) {
    return mark
  }

  return (
    <Link
      href={href}
      aria-label="Bulletin home"
      className="inline-flex rounded-[2rem] focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] focus-visible:outline-none"
    >
      {mark}
    </Link>
  )
}
