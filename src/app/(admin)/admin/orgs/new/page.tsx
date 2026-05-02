import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { GlassCard } from '@/components/dashboard/GlassCard'
import { createOrganization } from './actions'

export const metadata = { title: 'New Organization — Bulletin Admin' }

export default async function NewOrgPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/orgs" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] flex items-center gap-1 transition-colors">
          <ArrowLeft size={14} /> Back to organizations
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">New Organization</h1>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-[var(--color-status-rejected-bg)] text-[var(--color-status-rejected-text)] text-sm">
          {error}
        </div>
      )}

      <GlassCard hover={false} className="p-6">
        <form action={createOrganization} className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="name" className="block text-sm font-medium text-[var(--color-text-secondary)]">Name</label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="e.g. Photography Club"
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none input-inti"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="slug" className="block text-sm font-medium text-[var(--color-text-secondary)]">Slug</label>
            <input
              id="slug"
              name="slug"
              type="text"
              required
              placeholder="e.g. photography-club"
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none input-inti font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="org_type" className="block text-sm font-medium text-[var(--color-text-secondary)]">Type</label>
            <select
              id="org_type"
              name="org_type"
              required
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] focus:outline-none input-inti"
            >
              <option value="club">Club</option>
              <option value="department">Department</option>
              <option value="society">Society</option>
              <option value="faculty">Faculty</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="description" className="block text-sm font-medium text-[var(--color-text-secondary)]">
              Description <span className="text-[var(--color-text-muted)] font-normal">(optional)</span>
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              placeholder="Brief description of this organization..."
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none input-inti resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl text-sm font-semibold bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white transition-colors"
          >
            Create Organization
          </button>
        </form>
      </GlassCard>
    </div>
  )
}
