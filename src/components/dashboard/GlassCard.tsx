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
        'rounded-2xl border transition-[transform,background,border-color,box-shadow] duration-300 ease-[var(--ease-ui)]',
        'bg-[var(--color-glass-bg)] backdrop-blur-[16px] border-[var(--color-glass-border)]',
        hover && 'hover:-translate-y-0.5 hover:border-[color-mix(in_oklab,var(--color-accent)_26%,var(--color-glass-border))] hover:shadow-[var(--shadow-soft)] active:translate-y-0',
        className
      )}
    >
      {children}
    </div>
  )
}
