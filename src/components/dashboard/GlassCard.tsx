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
        'rounded-[1.05rem] border transition-[transform,background,border-color,box-shadow] duration-300 ease-[var(--ease-ui)]',
        'border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-surface)_92%,transparent)]',
        'shadow-[0_1px_0_rgba(36,24,21,0.05),0_12px_28px_rgba(95,61,22,0.06)]',
        hover &&
          'hover:-translate-y-0.5 hover:border-[color-mix(in_oklab,var(--color-accent)_26%,var(--color-glass-border))] hover:bg-[var(--color-surface)] hover:shadow-[var(--shadow-hover)] active:translate-y-0 active:scale-[0.99]',
        className
      )}
    >
      {children}
    </div>
  )
}
