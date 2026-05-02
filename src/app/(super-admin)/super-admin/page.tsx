import Link from 'next/link'
import { ShieldCheck, Tag, UserCog, BarChart3, ArrowRight } from 'lucide-react'
import { GlassCard } from '@/components/dashboard/GlassCard'
import { CountUp } from '@/components/dashboard/CountUp'
import { getPlatformStats } from '@/lib/data'

export const metadata = { title: 'Super Admin — Bulletin' }

export default async function SuperAdminPage() {
  const stats = await getPlatformStats()

  const tiles = [
    { label: 'Total Announcements', value: stats.totalAnnouncements },
    { label: 'Published', value: stats.publishedCount },
    { label: 'Pending Review', value: stats.pendingReview },
    { label: 'Organizations', value: stats.totalOrgs },
    { label: 'Total Users', value: stats.totalUsers },
  ]

  const quickLinks = [
    { href: '/super-admin/admins', label: 'Manage Admins', icon: ShieldCheck, desc: 'View and invite admin users' },
    { href: '/super-admin/categories', label: 'Categories', icon: Tag, desc: 'Create and manage announcement categories' },
    { href: '/super-admin/users', label: 'Users', icon: UserCog, desc: 'View all users and reset passwords' },
    { href: '/super-admin/analytics', label: 'Analytics', icon: BarChart3, desc: 'Platform-wide analytics' },
  ]

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">Platform Overview</h1>
        <p className="text-[var(--color-text-secondary)] mt-1">Full administrative control over Bulletin.</p>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-0 divide-x divide-[var(--color-border)] overflow-x-auto">
        {tiles.map(({ label, value }) => (
          <div key={label} className="flex-1 px-6 first:pl-0 last:pr-0 min-w-[110px]">
            <CountUp value={value} className="text-3xl font-bold font-mono text-[var(--color-accent)]" />
            <p className="text-xs uppercase tracking-widest text-[var(--color-text-muted)] mt-1 leading-tight">{label}</p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {quickLinks.map(({ href, label, icon: Icon, desc }) => (
          <Link key={href} href={href}>
            <GlassCard hover className="p-5 flex items-center gap-4 group">
              <div className="h-10 w-10 rounded-xl bg-[var(--color-accent-surface)] flex items-center justify-center shrink-0">
                <Icon size={18} className="text-[var(--color-accent)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">{label}</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{desc}</p>
              </div>
              <ArrowRight size={14} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] transition-colors shrink-0" />
            </GlassCard>
          </Link>
        ))}
      </div>
    </div>
  )
}
