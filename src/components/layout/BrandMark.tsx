import Image from 'next/image'
import { cn } from '@/lib/utils'

type BrandMarkSize = 'sm' | 'md' | 'lg' | 'xl' | 'hero'

type BrandMarkProps = {
  size?: BrandMarkSize
  showText?: boolean
  className?: string
  imageClassName?: string
  textClassName?: string
  preload?: boolean
}

const shellSizes: Record<BrandMarkSize, string> = {
  sm: 'h-11 w-11 rounded-xl',
  md: 'h-14 w-14 rounded-2xl',
  lg: 'h-[4.5rem] w-[4.5rem] rounded-[1.35rem]',
  xl: 'h-20 w-20 rounded-[1.45rem] sm:h-24 sm:w-24 sm:rounded-[1.65rem]',
  hero: 'h-28 w-28 rounded-[1.9rem] sm:h-32 sm:w-32 lg:h-40 lg:w-40',
}

const imageSizes: Record<BrandMarkSize, string> = {
  sm: 'h-9 w-9',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
  xl: 'h-[4.6rem] w-[4.6rem] sm:h-[5.5rem] sm:w-[5.5rem]',
  hero: 'h-24 w-24 sm:h-28 sm:w-28 lg:h-36 lg:w-36',
}

export function BrandMark({
  size = 'md',
  showText = true,
  className,
  imageClassName,
  textClassName,
  preload = false,
}: BrandMarkProps) {
  return (
    <div className={cn('flex min-w-0 items-center gap-3', className)}>
      <div
        className={cn(
          'relative flex shrink-0 items-center justify-center border bg-[var(--color-mark-bg)] shadow-[var(--shadow-button)]',
          'after:absolute after:inset-1 after:rounded-[inherit] after:border after:border-white/10 after:content-[""]',
          shellSizes[size]
        )}
        style={{
          borderColor: 'color-mix(in oklab, var(--color-gold) 42%, var(--color-border))',
        }}
      >
        <Image
          src="/bulletin_logo.png"
          alt="Bulletin"
          width={160}
          height={160}
          className={cn('relative z-10 object-contain drop-shadow-sm', imageSizes[size], imageClassName)}
          preload={preload}
        />
      </div>

      {showText && (
        <div className={cn('min-w-0', textClassName)}>
          <p className="font-display text-2xl leading-none font-bold text-[var(--color-text-primary)] sm:text-3xl">
            Bulletin
          </p>
          <p className="mt-1 truncate text-[10px] font-bold tracking-[0.2em] text-[var(--color-accent-inti)] uppercase sm:text-xs">
            INTI International University
          </p>
        </div>
      )}
    </div>
  )
}
