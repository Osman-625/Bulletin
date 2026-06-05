import { cn } from '@/lib/utils'
import type { HTMLAttributes, ReactNode } from 'react'

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  hover?: boolean
}

export function GlassCard({ children, className, hover = true, ...props }: GlassCardProps) {
  return (
    <div
      {...props}
      className={cn(
        'rounded-[var(--radius-control)] border transition-[transform,background,border-color,box-shadow] duration-300 ease-[var(--ease-ui)]',
        'border-[var(--color-border)] bg-[linear-gradient(135deg,color-mix(in_oklab,var(--color-surface)_98%,transparent),color-mix(in_oklab,var(--color-surface-elevated)_32%,var(--color-surface)))]',
        'shadow-[0_1px_0_rgba(36,24,21,0.05),0_10px_24px_rgba(95,61,22,0.055)]',
        hover &&
          'hover:-translate-y-0.5 hover:border-[color-mix(in_oklab,var(--color-accent)_24%,var(--color-glass-border))] hover:bg-[var(--color-surface)] hover:shadow-[var(--shadow-hover)] active:translate-y-0 active:scale-[0.99]',
        className
      )}
    >
      {children}
    </div>
  )
}
