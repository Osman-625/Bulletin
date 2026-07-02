import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { ArrowRight } from 'lucide-react'
import { CountUp } from '@/components/dashboard/CountUp'
import { cn } from '@/shared/utils'

type BoardAction = {
  href: string
  label: string
  icon?: LucideIcon
  variant?: 'primary' | 'secondary'
}

type BoardMetric = {
  label: string
  value: number | string
  caption: string
  icon: LucideIcon
  href?: string
  tone?: 'accent' | 'gold' | 'muted'
}

type BoardRowMeta = {
  label: string
  color?: string | null
}

type BoardRowProps = {
  href: string
  title: string
  index?: number
  meta?: BoardRowMeta[]
  statusLabel?: string
  statusTone?: string
  stat?: string
  statLabel?: string
}

type BoardRowContentProps = Omit<BoardRowProps, 'href'> & {
  showArrow?: boolean
}

const EMPTY_BOARD_ROW_META: BoardRowMeta[] = []

export function DashboardBoardPage({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      data-dashboard-page
      className={cn(
        'dashboard-page board-page mx-auto w-full max-w-[90rem] px-4 py-5 sm:px-6 lg:px-7 xl:px-8',
        className
      )}
    >
      {children}
    </div>
  )
}

export function DashboardBoardHeader({
  kicker,
  title,
  description,
  action,
}: {
  kicker: string
  title: string
  description: string
  action?: BoardAction
}) {
  const ActionIcon = action?.icon

  return (
    <header className="board-header">
      <div className="board-header-mark" aria-hidden="true" />
      <div className="board-header-copy min-w-0">
        <p className="board-kicker">{kicker}</p>
        <h1 className="board-title">{title}</h1>
        <p className="board-description">{description}</p>
      </div>
      {action ? (
        <Link
          href={action.href}
          className={cn(
            'board-header-action',
            action.variant === 'secondary' ? 'pub-public-link' : 'pub-btn-primary'
          )}
        >
          {ActionIcon ? <ActionIcon size={15} aria-hidden="true" /> : null}
          {action.label}
        </Link>
      ) : null}
    </header>
  )
}

export function DashboardBoardMetrics({ metrics }: { metrics: BoardMetric[] }) {
  return (
    <section className="board-metrics" aria-label="Dashboard metrics">
      {metrics.map(({ label, value, caption, icon: Icon, href, tone = 'muted' }) => {
        const content = (
          <>
            <span className={`board-metric-icon tone-${tone}`} aria-hidden="true">
              <Icon size={16} aria-hidden="true" />
            </span>
            <span className={`board-metric-value tone-${tone}`}>
              {typeof value === 'number' ? <CountUp value={value} /> : value}
            </span>
            <span className="board-metric-label">{label}</span>
            <span className="board-metric-caption">{caption}</span>
          </>
        )

        return href ? (
          <Link
            key={label}
            href={href}
            className={`board-metric-card action-lift tone-${tone}`}
            aria-label={`${label}: ${value}, ${caption}`}
          >
            {content}
          </Link>
        ) : (
          <div key={label} className={`board-metric-card tone-${tone}`}>
            {content}
          </div>
        )
      })}
    </section>
  )
}

export function DashboardBoardBoard({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn('board-board', className)}>{children}</div>
}

export function DashboardBoardPanel({
  title,
  count,
  action,
  children,
  className,
  bodyClassName,
}: {
  title: string
  count?: string
  action?: BoardAction
  children: React.ReactNode
  className?: string
  bodyClassName?: string
}) {
  const ActionIcon = action?.icon ?? ArrowRight

  return (
    <section className={cn('board-panel', className)} data-has-action={action ? 'true' : 'false'}>
      <div className="board-panel-head">
        <h2>
          {title}
          {count != null ? <span className="board-panel-count">{count}</span> : null}
        </h2>
        {action ? (
          <Link href={action.href} className="board-panel-link">
            {action.label}
            <ActionIcon size={12} aria-hidden="true" />
          </Link>
        ) : null}
      </div>
      <div className={cn('board-list', bodyClassName)}>{children}</div>
    </section>
  )
}

export function DashboardBoardRow({ href, ...props }: BoardRowProps) {
  return (
    <Link href={href} className="board-row">
      <DashboardBoardRowContent {...props} showArrow />
    </Link>
  )
}

export function DashboardBoardStaticRow(props: BoardRowContentProps) {
  return (
    <div className="board-row board-row-static">
      <DashboardBoardRowContent {...props} />
    </div>
  )
}

function DashboardBoardRowContent({
  title,
  index,
  meta = EMPTY_BOARD_ROW_META,
  statusLabel,
  statusTone = 'draft',
  stat,
  statLabel,
  showArrow = false,
}: BoardRowContentProps) {
  return (
    <>
      {index != null ? (
        <span className="board-row-index">{String(index + 1).padStart(2, '0')}</span>
      ) : null}
      <span className="board-row-main">
        <span className="board-row-title">{title}</span>
        {meta.length > 0 ? (
          <span className="board-row-meta">
            {meta.map((item) => (
              <span key={item.label} className="board-row-meta-item">
                {item.color ? (
                  <span
                    className="pub-dot"
                    style={{ backgroundColor: item.color }}
                    aria-hidden="true"
                  />
                ) : null}
                {item.label}
              </span>
            ))}
          </span>
        ) : null}
      </span>
      {statusLabel ? (
        <span className={`board-status tone-${statusTone}`}>{statusLabel}</span>
      ) : null}
      {stat ? (
        <span className="board-row-stat">
          {stat}
          {statLabel ? <span>{statLabel}</span> : null}
        </span>
      ) : null}
      {showArrow ? <ArrowRight size={14} className="board-row-arrow" aria-hidden="true" /> : null}
    </>
  )
}

export function DashboardBoardEmpty({ children }: { children: React.ReactNode }) {
  return <p className="board-empty">{children}</p>
}
