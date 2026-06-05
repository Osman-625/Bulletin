import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { ArrowRight } from 'lucide-react'
import { CountUp } from '@/components/dashboard/CountUp'
import { cn } from '@/lib/utils'

type DeskAction = {
  href: string
  label: string
  icon?: LucideIcon
  variant?: 'primary' | 'secondary'
}

type DeskMetric = {
  label: string
  value: number | string
  caption: string
  icon: LucideIcon
  href?: string
  tone?: 'accent' | 'gold' | 'muted'
}

type DeskRowMeta = {
  label: string
  color?: string | null
}

type DeskRowProps = {
  href: string
  title: string
  index?: number
  meta?: DeskRowMeta[]
  statusLabel?: string
  statusTone?: string
  stat?: string
  statLabel?: string
}

type DeskRowContentProps = Omit<DeskRowProps, 'href'> & {
  showArrow?: boolean
}

const EMPTY_DESK_ROW_META: DeskRowMeta[] = []

export function DashboardDeskPage({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'dashboard-page desk-page mx-auto w-full max-w-[90rem] px-4 py-5 sm:px-6 lg:px-7 xl:px-8',
        className
      )}
    >
      {children}
    </div>
  )
}

export function DashboardDeskHeader({
  kicker,
  title,
  description,
  action,
}: {
  kicker: string
  title: string
  description: string
  action?: DeskAction
}) {
  const ActionIcon = action?.icon

  return (
    <header className="desk-header">
      <div className="min-w-0">
        <p className="desk-kicker">{kicker}</p>
        <h1 className="desk-title">{title}</h1>
        <p className="desk-description">{description}</p>
      </div>
      {action ? (
        <Link
          href={action.href}
          className={action.variant === 'secondary' ? 'pub-public-link' : 'pub-btn-primary'}
        >
          {ActionIcon ? <ActionIcon size={15} aria-hidden="true" /> : null}
          {action.label}
        </Link>
      ) : null}
    </header>
  )
}

export function DashboardDeskMetrics({ metrics }: { metrics: DeskMetric[] }) {
  return (
    <section className="desk-metrics" aria-label="Dashboard metrics">
      {metrics.map(({ label, value, caption, icon: Icon, href, tone = 'muted' }) => {
        const content = (
          <>
            <span className={`desk-metric-icon tone-${tone}`}>
              <Icon size={16} aria-hidden="true" />
            </span>
            <span className={`desk-metric-value tone-${tone}`}>
              {typeof value === 'number' ? <CountUp value={value} /> : value}
            </span>
            <span className="desk-metric-label">{label}</span>
            <span className="desk-metric-caption">{caption}</span>
          </>
        )

        return href ? (
          <Link key={label} href={href} className="desk-metric-card action-lift">
            {content}
          </Link>
        ) : (
          <div key={label} className="desk-metric-card">
            {content}
          </div>
        )
      })}
    </section>
  )
}

export function DashboardDeskBoard({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn('desk-board', className)}>{children}</div>
}

export function DashboardDeskPanel({
  title,
  count,
  action,
  children,
  className,
  bodyClassName,
}: {
  title: string
  count?: string
  action?: DeskAction
  children: React.ReactNode
  className?: string
  bodyClassName?: string
}) {
  const ActionIcon = action?.icon ?? ArrowRight

  return (
    <section className={cn('desk-panel', className)}>
      <div className="desk-panel-head">
        <h2>
          {title}
          {count != null ? <span>{count}</span> : null}
        </h2>
        {action ? (
          <Link href={action.href} className="desk-panel-link">
            {action.label}
            <ActionIcon size={12} aria-hidden="true" />
          </Link>
        ) : null}
      </div>
      <div className={cn('desk-list', bodyClassName)}>{children}</div>
    </section>
  )
}

export function DashboardDeskRow({ href, ...props }: DeskRowProps) {
  return (
    <Link href={href} className="desk-row">
      <DashboardDeskRowContent {...props} showArrow />
    </Link>
  )
}

export function DashboardDeskStaticRow(props: DeskRowContentProps) {
  return (
    <div className="desk-row desk-row-static">
      <DashboardDeskRowContent {...props} />
    </div>
  )
}

function DashboardDeskRowContent({
  title,
  index,
  meta = EMPTY_DESK_ROW_META,
  statusLabel,
  statusTone = 'draft',
  stat,
  statLabel,
  showArrow = false,
}: DeskRowContentProps) {
  return (
    <>
      {index != null ? (
        <span className="desk-row-index">{String(index + 1).padStart(2, '0')}</span>
      ) : null}
      <span className="desk-row-main">
        <span className="desk-row-title">{title}</span>
        {meta.length > 0 ? (
          <span className="desk-row-meta">
            {meta.map((item) => (
              <span key={item.label} className="desk-row-meta-item">
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
      {statusLabel ? <span className={`desk-status tone-${statusTone}`}>{statusLabel}</span> : null}
      {stat ? (
        <span className="desk-row-stat">
          {stat}
          {statLabel ? <span>{statLabel}</span> : null}
        </span>
      ) : null}
      {showArrow ? <ArrowRight size={14} className="desk-row-arrow" aria-hidden="true" /> : null}
    </>
  )
}

export function DashboardDeskEmpty({ children }: { children: React.ReactNode }) {
  return <p className="desk-empty">{children}</p>
}
