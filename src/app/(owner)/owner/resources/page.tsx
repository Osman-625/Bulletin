import Link from 'next/link'
import {
  Activity,
  ArrowUpRight,
  Database,
  Eye,
  FileX,
  HardDrive,
  LockKeyhole,
  Server,
} from 'lucide-react'
import { CountUp } from '@/components/dashboard/CountUp'
import { GlassCard } from '@/components/dashboard/GlassCard'
import { DashboardBoardHeader, DashboardBoardPage } from '@/components/dashboard/DashboardBoard'
import { createServiceClient } from '@/infrastructure/database/server'
import {
  type ExternalResourceCard,
  type OwnerResourceOverview,
  getOwnerResourceOverview,
} from '@/modules/owner/resources'

export const metadata = { title: 'Resources — Bulletin Owner' }

const toneClasses: Record<NonNullable<ExternalResourceCard['metrics'][number]['tone']>, string> = {
  neutral: 'text-[var(--color-text-primary)]',
  good: 'text-[var(--color-status-published-text)]',
  warn: 'text-[var(--color-gold-text)]',
  bad: 'text-[var(--color-status-rejected-text)]',
}

const resourceStatusStyles: Record<ExternalResourceCard['status'], string> = {
  ready: 'bg-[var(--color-status-published-bg)] text-[var(--color-status-published-text)]',
  attention:
    'bg-[color-mix(in_oklab,var(--color-gold)_12%,transparent)] text-[var(--color-gold-text)]',
  not_configured: 'bg-[var(--color-status-submitted-bg)] text-[var(--color-status-submitted-text)]',
  error: 'bg-[var(--color-status-rejected-bg)] text-[var(--color-status-rejected-text)]',
}

export default async function OwnerResourcesPage() {
  const supabase = await createServiceClient()
  const overview = await getOwnerResourceOverview(supabase)

  return (
    <DashboardBoardPage className="flex flex-col gap-6">
      <DashboardBoardHeader
        kicker="Owner only · Read-only"
        title="Resources"
        description="Platform health, announcement view counters, storage footprint, and optional Vercel and Supabase resource signals."
        action={{
          href: '/owner/analytics',
          label: 'Analytics',
          icon: ArrowUpRight,
          variant: 'secondary',
        }}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          icon={Eye}
          label="Total Views"
          value={overview.totalViews}
          helper="All tracked announcement detail views"
        />
        <MetricCard
          icon={Activity}
          label="Published Views"
          value={overview.publishedViews}
          helper={`${overview.averageViews.toLocaleString('en-MY')} average per published post`}
          progress={
            overview.totalViews > 0
              ? Math.round((overview.publishedViews / overview.totalViews) * 100)
              : 0
          }
        />
        <MetricCard
          icon={HardDrive}
          label="Banner Storage"
          value={overview.bannerFiles}
          helper={`${formatBytes(overview.bannerStorageBytes)} used`}
          tone={overview.bannerStorageStatus === 'ready' ? 'accent' : 'warn'}
        />
        <MetricCard
          icon={FileX}
          label="Orphaned Files"
          value={overview.orphanedFiles}
          helper="Unused banner assets"
          tone={overview.orphanedFiles > 0 ? 'warn' : 'accent'}
        />
        <MetricCard
          icon={LockKeyhole}
          label="Password Resets"
          value={overview.pendingPasswordResets}
          helper="Pending reset requests"
          tone={overview.pendingPasswordResets > 0 ? 'warn' : 'accent'}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <ExternalResourcePanel icon={Server} resource={overview.external.vercel} />
        <ExternalResourcePanel icon={Database} resource={overview.external.supabase} />
      </section>

      <section className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <TopAnnouncements overview={overview} />
        <OperationsPanel overview={overview} />
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <DistributionPanel
          title="Views by Category"
          rows={overview.viewsByCategory.map((row) => ({
            name: row.name,
            value: row.views,
            color: row.color,
          }))}
        />
        <DistributionPanel
          title="Views by Organization"
          rows={overview.viewsByOrganization.map((row) => ({
            name: row.name,
            value: row.views,
          }))}
        />
      </section>
    </DashboardBoardPage>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  helper,
  tone = 'accent',
  progress,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  value: number
  helper: string
  tone?: 'accent' | 'warn'
  progress?: number
}) {
  return (
    <GlassCard hover={false} className="flex flex-col gap-0 p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-xs font-semibold tracking-[0.16em] text-[var(--color-text-muted)] uppercase">
          {label}
        </p>
        <span
          className={
            tone === 'warn' ? 'text-[var(--color-gold-text)]' : 'text-[var(--color-accent-inti)]'
          }
        >
          <Icon size={17} aria-hidden="true" />
        </span>
      </div>
      <CountUp
        value={value}
        className="font-mono text-4xl font-bold text-[var(--color-text-primary)]"
      />
      <p className="mt-2 text-xs leading-5 text-[var(--color-text-muted)]">{helper}</p>
      {progress !== undefined && (
        <div className="mt-4">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-elevated)]">
            <div
              className={`h-1.5 rounded-full transition-all duration-700 ${
                tone === 'warn' ? 'bg-[var(--color-gold)]' : 'bg-[var(--color-accent-inti)]'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
          <p className="mt-1.5 text-right font-mono text-[11px] text-[var(--color-text-muted)]">
            {Math.round(progress)}%
          </p>
        </div>
      )}
    </GlassCard>
  )
}

const STATUS_BAR: Record<ExternalResourceCard['status'], { width: string; color: string }> = {
  ready: { width: '100%', color: 'var(--color-status-published-text)' },
  attention: { width: '60%', color: 'var(--color-gold)' },
  not_configured: { width: '0%', color: 'var(--color-text-muted)' },
  error: { width: '20%', color: 'var(--color-status-rejected-text)' },
}

function ExternalResourcePanel({
  icon: Icon,
  resource,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  resource: ExternalResourceCard
}) {
  const bar = STATUS_BAR[resource.status]

  return (
    <GlassCard hover={false} className="overflow-hidden p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--color-surface-elevated)] text-[var(--color-accent-inti)]">
            <Icon size={18} aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
              {resource.name}
            </h2>
            <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">
              {resource.summary}
            </p>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold tracking-[0.08em] uppercase ${resourceStatusStyles[resource.status]}`}
        >
          {resource.status.replace('_', ' ')}
        </span>
      </div>

      {/* Status health bar */}
      <div className="mb-4 h-1 w-full overflow-hidden rounded-full bg-[var(--color-surface-elevated)]">
        <div
          className="h-1 rounded-full transition-all duration-700"
          style={{ width: bar.width, background: bar.color }}
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {resource.metrics.map((metric) => (
          <div
            key={`${resource.name}-${metric.label}`}
            className="rounded-xl bg-[var(--color-surface-elevated)] p-3"
          >
            <p className="text-[11px] font-semibold tracking-[0.14em] text-[var(--color-text-muted)] uppercase">
              {metric.label}
            </p>
            <p
              className={`mt-1 truncate text-sm font-semibold ${toneClasses[metric.tone ?? 'neutral']}`}
              title={metric.value}
            >
              {metric.value}
            </p>
          </div>
        ))}
      </div>

      {resource.href && (
        <Link
          href={resource.href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--color-border)] px-4 text-sm font-semibold text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
        >
          Open dashboard
          <ArrowUpRight size={14} aria-hidden="true" />
        </Link>
      )}
    </GlassCard>
  )
}

function TopAnnouncements({ overview }: { overview: OwnerResourceOverview }) {
  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]">
        Top Viewed Announcements
      </h2>
      <div className="space-y-2">
        {overview.topAnnouncements.length === 0 ? (
          <GlassCard hover={false} className="p-6">
            <output className="block text-sm">
              <p className="font-semibold text-[var(--color-text-primary)]">
                No tracked announcement views yet
              </p>
              <p className="mt-1 text-[var(--color-text-secondary)]">
                Announcement rankings will appear after public detail pages receive visits.
              </p>
            </output>
          </GlassCard>
        ) : (
          overview.topAnnouncements.map((announcement, index) => (
            <GlassCard
              key={announcement.id}
              hover={false}
              className="flex items-center gap-4 px-4 py-3"
            >
              <span className="w-6 shrink-0 font-mono text-sm text-[var(--color-text-muted)]">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
                  {announcement.title}
                </p>
                <p className="mt-1 truncate text-xs text-[var(--color-text-muted)]">
                  {announcement.organizations?.name ?? 'Unknown organization'}
                  {announcement.categories?.name ? ` · ${announcement.categories.name}` : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm font-bold text-[var(--color-text-primary)]">
                  {(announcement.view_count ?? 0).toLocaleString('en-MY')}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">views</p>
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </section>
  )
}

function OperationsPanel({ overview }: { overview: OwnerResourceOverview }) {
  const rows = [
    {
      label: 'Setup route',
      value: overview.setupRouteEnabled ? 'Enabled' : 'Disabled',
      tone: overview.setupRouteEnabled ? 'bad' : 'good',
    },
    {
      label: 'Banner bucket',
      value:
        overview.bannerStorageStatus === 'ready'
          ? 'Readable'
          : overview.bannerStorageStatus === 'missing'
            ? 'Missing'
            : 'Check storage',
      tone: overview.bannerStorageStatus === 'ready' ? 'good' : 'warn',
    },
    {
      label: 'Registration posts',
      value: overview.postsWithRegistration.toLocaleString('en-MY'),
      tone: 'neutral',
    },
    {
      label: 'Resource mode',
      value: 'Read-only',
      tone: 'good',
    },
  ] as const

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]">
        Operational Guardrails
      </h2>
      <GlassCard hover={false} className="p-5">
        <div className="space-y-3">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-4 border-b border-[var(--color-border)] pb-3 last:border-0 last:pb-0"
            >
              <p className="text-sm text-[var(--color-text-secondary)]">{row.label}</p>
              <p className={`text-sm font-semibold ${toneClasses[row.tone]}`}>{row.value}</p>
            </div>
          ))}
        </div>
      </GlassCard>
    </section>
  )
}

function DistributionPanel({
  title,
  rows,
}: {
  title: string
  rows: Array<{ name: string; value: number; color?: string }>
}) {
  const max = Math.max(...rows.map((row) => row.value), 1)

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]">{title}</h2>
      <GlassCard hover={false} className="p-5">
        {rows.length === 0 ? (
          <output className="block text-sm">
            <p className="font-semibold text-[var(--color-text-primary)]">
              No view distribution yet
            </p>
            <p className="mt-1 text-[var(--color-text-secondary)]">
              View distribution will appear after announcements receive tracked visits.
            </p>
          </output>
        ) : (
          <div className="space-y-4">
            {rows.map((row) => (
              <div key={row.name}>
                <div className="mb-1.5 flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-2">
                    {row.color && (
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ background: row.color }}
                        aria-hidden="true"
                      />
                    )}
                    <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
                      {row.name}
                    </p>
                  </div>
                  <p className="font-mono text-sm font-semibold text-[var(--color-text-primary)]">
                    {row.value.toLocaleString('en-MY')}
                  </p>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--color-surface-elevated)]">
                  <div
                    className="h-1.5 rounded-full bg-[var(--color-accent-inti)]"
                    style={{ width: `${Math.round((row.value / max) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </section>
  )
}

function formatBytes(bytes: number) {
  if (bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}
