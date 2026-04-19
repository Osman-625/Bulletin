import { cn } from '@/lib/utils'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
}

export function GlassCard({ children, className, hover = true }: GlassCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border transition-all duration-300',
        'bg-[var(--color-glass-bg)] backdrop-blur-[16px] border-[var(--color-glass-border)]',
        hover && 'hover:-translate-y-0.5 hover:border-[var(--color-accent)]/20',
        className
      )}
    >
      {children}
    </div>
  )
}
