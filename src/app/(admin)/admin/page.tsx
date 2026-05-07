import Link from 'next/link'
import { ClipboardList, Building2, Users, ArrowRight } from 'lucide-react'
import { GlassCard } from '@/components/dashboard/GlassCard'
import { StatusBadge } from '@/components/dashboard/StatusBadge'
import { CountUp } from '@/components/dashboard/CountUp'
import { getAdminStats, getSubmittedAnnouncements } from '@/lib/data'

export const metadata = { title: 'Admin — Bulletin' }

export default async function AdminPage() {
  const [stats, queue] = await Promise.all([
    getAdminStats(),
    getSubmittedAnnouncements(),
  ])

  const recent = queue.slice(0, 5)

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">Admin Panel</h1>
        <p className="text-[var(--color-text-secondary)] mt-1">Review announcements and manage the platform.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Pending Review', value: stats.pendingReview, icon: ClipboardList, href: '/admin/review', urgent: stats.pendingReview > 0 },
          { label: 'Published This Month', value: stats.publishedThisMonth, icon: ArrowRight, href: null, urgent: false },
          { label: 'Organizations', value: stats.totalOrgs, icon: Building2, href: '/admin/orgs', urgent: false },
          { label: 'Publishers', value: stats.totalPublishers, icon: Users, href: '/admin/publishers', urgent: false },
        ].map(({ label, value, icon: Icon, href, urgent }) => (
          <GlassCard key={label} hover={!!href} className="p-5">
            {href ? (
              <Link href={href} className="block">
                <div className="flex items-start justify-between mb-3">
                  <Icon size={18} className={urgent ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'} />
                  {urgent && value > 0 && (
                    <span className="text-[15px] font-bold uppercase tracking-wider text-[var(--color-accent)] bg-[var(--color-accent-surface)] px-2 py-0.5 rounded-full">
                      Action needed
                    </span>
                  )}
                </div>
                <CountUp value={value} className={`text-3xl font-bold font-mono ${urgent && value > 0 ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-primary)]'}`} />
                <p className="text-xs uppercase tracking-widest text-[var(--color-text-muted)] mt-1">{label}</p>
              </Link>
            ) : (
              <div>
                <div className="flex items-start mb-3">
                  <Icon size={18} className="text-[var(--color-text-muted)]" />
                </div>
                <CountUp value={value} className="text-3xl font-bold font-mono text-[var(--color-text-primary)]" />
                <p className="text-xs uppercase tracking-widest text-[var(--color-text-muted)] mt-1">{label}</p>
              </div>
            )}
          </GlassCard>
        ))}
      </div>

      {/* Review queue preview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Pending Review</h2>
          <Link href="/admin/review" className="text-sm text-[var(--color-accent)] hover:underline flex items-center gap-1">
            View all <ArrowRight size={13} />
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="text-center py-12 text-[var(--color-text-muted)] text-sm">
            No submissions waiting — all clear.
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map((a) => (
              <Link key={a.id} href={`/admin/review/${a.id}`}>
                <GlassCard hover className="px-5 py-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge status="submitted" />
                      <span className="text-sm font-medium text-[var(--color-text-primary)] truncate">{a.title}</span>
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {a.organizations?.name ?? '—'} · {a.categories?.name ?? 'Uncategorized'}
                    </p>
                  </div>
                  <p className="text-xs font-mono text-[var(--color-text-muted)] shrink-0">
                    {new Date(a.updated_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}
                  </p>
                </GlassCard>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
