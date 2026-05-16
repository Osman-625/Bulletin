import Link from 'next/link'
import { ArrowRight, BarChart3, ShieldCheck, Tag, UserCog } from 'lucide-react'
import { CountUp } from '@/components/dashboard/CountUp'
import { getPlatformStats } from '@/lib/data'

export const metadata = { title: 'Platform Overview' }

export default async function SuperAdminPage() {
  const stats = await getPlatformStats()

  const tiles = [
    { label: 'Announcements', value: stats.totalAnnouncements },
    { label: 'Published', value: stats.publishedCount },
    { label: 'Pending review', value: stats.pendingReview },
    { label: 'Organizations', value: stats.totalOrgs },
    { label: 'Users', value: stats.totalUsers },
  ]

  const quickLinks = [
    {
      href: '/super-admin/admins',
      label: 'Admin access',
      icon: ShieldCheck,
      desc: 'Invite and manage administrators.',
    },
    {
      href: '/super-admin/categories',
      label: 'Category system',
      icon: Tag,
      desc: 'Maintain the public topic structure.',
    },
    {
      href: '/super-admin/users',
      label: 'User directory',
      icon: UserCog,
      desc: 'View users and support account recovery.',
    },
    {
      href: '/super-admin/analytics',
      label: 'Platform analytics',
      icon: BarChart3,
      desc: 'View publication activity across the platform.',
    },
  ]

  return (
    <div className="dashboard-page mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <section className="grid gap-3 xl:grid-cols-12">
        <div className="dashboard-command-card rounded-[1.5rem] p-6 sm:p-8 xl:col-span-8">
          <p className="future-kicker">Platform overview</p>
          <h1 className="font-display mt-4 text-4xl leading-none font-extrabold text-[var(--color-text-primary)] sm:text-5xl">
            System-wide publishing control
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)] sm:text-base">
            Monitor the full Bulletin platform, maintain access, and keep the campus publishing
            structure consistent.
          </p>
        </div>

        <div className="dashboard-command-card rounded-[1.5rem] p-5 xl:col-span-4">
          <p className="future-kicker">Pending review</p>
          <CountUp
            value={stats.pendingReview}
            className="mt-5 block font-mono text-5xl font-bold text-[var(--color-accent)]"
          />
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
            Submitted announcements currently waiting across the platform.
          </p>
        </div>

        {tiles.map(({ label, value }) => (
          <div
            key={label}
            className="dashboard-command-card rounded-[1.2rem] p-4 sm:p-5 xl:col-span-2 xl:last:col-span-4"
          >
            <CountUp
              value={value}
              className="block font-mono text-3xl font-bold text-[var(--color-text-primary)]"
            />
            <p className="mt-2 text-[0.68rem] font-bold tracking-[0.14em] text-[var(--color-text-muted)] uppercase">
              {label}
            </p>
          </div>
        ))}
      </section>

      <section className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        {quickLinks.map(({ href, label, icon: Icon, desc }) => (
          <Link
            key={href}
            href={href}
            className="dashboard-command-card action-lift group rounded-[1.3rem] p-5"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.95rem] bg-[var(--color-accent-surface)] text-[var(--color-accent)]">
                <Icon size={18} aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[var(--color-text-primary)]">{label}</p>
                <p className="mt-1 text-sm leading-5 text-[var(--color-text-muted)]">{desc}</p>
              </div>
              <ArrowRight
                size={16}
                className="shrink-0 text-[var(--color-text-muted)] transition-transform duration-200 group-hover:translate-x-1 group-hover:text-[var(--color-accent)]"
                aria-hidden="true"
              />
            </div>
          </Link>
        ))}
      </section>
    </div>
  )
}
