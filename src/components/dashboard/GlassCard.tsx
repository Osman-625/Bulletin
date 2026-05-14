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
        'rounded-[0.9rem] border transition-[transform,background,border-color,box-shadow] duration-300 ease-[var(--ease-ui)]',
        'border-[var(--color-border)] bg-[var(--color-surface)]',
        'shadow-[0_1px_0_rgba(36,24,21,0.04)]',
        hover && 'hover:-translate-y-0.5 hover:border-[color-mix(in_oklab,var(--color-accent)_26%,var(--color-glass-border))] hover:shadow-[var(--shadow-soft)] active:translate-y-0',
        className
      )}
    >
      {children}
    </div>
  )
}
