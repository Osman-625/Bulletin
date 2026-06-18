import { cn } from '@/shared/utils'
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
        'dashboard-card relative rounded-[var(--radius-control)] border transition-[transform,background,border-color,box-shadow] duration-300 ease-[var(--ease-ui)]',
        'border-[var(--color-border)] bg-[linear-gradient(135deg,color-mix(in_oklab,var(--color-surface)_96%,transparent),color-mix(in_oklab,var(--color-surface-elevated)_26%,var(--color-surface)))]',
        'shadow-[0_1px_0_color-mix(in_oklab,var(--color-surface)_72%,transparent),0_12px_28px_color-mix(in_oklab,var(--color-gold)_10%,transparent)]',
        hover &&
          'hover:-translate-y-0.5 hover:bg-[var(--color-surface)] hover:shadow-[var(--shadow-hover)] active:translate-y-0 active:scale-[0.99]',
        className
      )}
    >
      {children}
    </div>
  )
}
