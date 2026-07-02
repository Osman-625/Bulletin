import { ArrowLeft, Building2 } from 'lucide-react'
import { DashboardBoardHeader, DashboardBoardPage } from '@/components/dashboard/DashboardBoard'
import { GlassCard } from '@/components/dashboard/GlassCard'
import { ORGANIZATION_TYPE_OPTIONS } from '@/modules/organizations/validation'
import { createOrganization } from './actions'

export const metadata = { title: 'New Organization, Bulletin Admin' }

export default async function NewOrgPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <DashboardBoardPage className="flex flex-col gap-5">
      <DashboardBoardHeader
        kicker="Admin directory"
        title="New organization"
        description="Create an approved campus workspace before assigning publisher accounts to it."
        action={{
          href: '/admin/orgs',
          label: 'Back to organizations',
          icon: ArrowLeft,
          variant: 'secondary',
        }}
      />

      {error && (
        <div className="rounded-[var(--radius-control)] bg-[var(--color-status-rejected-bg)] px-4 py-3 text-sm text-[var(--color-status-rejected-text)]">
          {error}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <GlassCard hover={false} className="p-6">
          <form action={createOrganization} className="space-y-5">
            <div className="space-y-1.5">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-[var(--color-text-secondary)]"
              >
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="e.g. Photography Club"
                className="input-inti w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="slug"
                className="block text-sm font-medium text-[var(--color-text-secondary)]"
              >
                Slug
              </label>
              <input
                id="slug"
                name="slug"
                type="text"
                required
                placeholder="e.g. photography-club"
                className="input-inti w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 font-mono text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="org_type"
                className="block text-sm font-medium text-[var(--color-text-secondary)]"
              >
                Type
              </label>
              <select
                id="org_type"
                name="org_type"
                required
                className="input-inti w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] focus:outline-none"
              >
                {ORGANIZATION_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-[var(--color-text-secondary)]"
              >
                Description{' '}
                <span className="font-normal text-[var(--color-text-muted)]">(optional)</span>
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                placeholder="Brief description of this organization"
                className="input-inti w-full resize-none rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
              />
            </div>

            <button type="submit" className="pub-btn-primary w-full justify-center">
              Create organization
            </button>
          </form>
        </GlassCard>

        <GlassCard hover={false} className="h-fit p-5 xl:sticky xl:top-5">
          <div className="mb-4 flex size-10 items-center justify-center rounded-[var(--radius-control)] bg-[var(--color-accent-surface)] text-[var(--color-accent-inti)]">
            <Building2 size={18} aria-hidden="true" />
          </div>
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
            Workspace setup
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
            Keep the slug short and readable. Publishers will see this organization name across
            their announcement workflow.
          </p>
        </GlassCard>
      </div>
    </DashboardBoardPage>
  )
}
