import { GlassCard } from '@/components/dashboard/GlassCard'
import { BackNavButton } from '@/components/navigation/BackNavButton'
import { ORGANIZATION_TYPE_OPTIONS } from '@/lib/organizations/validation'
import { createOrganization } from './actions'

export const metadata = { title: 'New Organization — Bulletin Admin' }

export default async function NewOrgPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-6 py-8">
      <div className="flex items-center gap-3">
        <BackNavButton
          fallbackHref="/admin/orgs"
          className="min-w-0 rounded-lg border-transparent bg-transparent px-0 text-sm text-[var(--color-text-muted)] shadow-none hover:border-transparent hover:bg-transparent hover:text-[var(--color-text-primary)] hover:shadow-none"
        >
          Back to organizations
        </BackNavButton>
      </div>

      <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
        New Organization
      </h1>

      {error && (
        <div className="rounded-xl bg-[var(--color-status-rejected-bg)] px-4 py-3 text-sm text-[var(--color-status-rejected-text)]">
          {error}
        </div>
      )}

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
              className="input-inti w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
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
              className="input-inti w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 font-mono text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
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
              className="input-inti w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] focus:outline-none"
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
              placeholder="Brief description of this organization..."
              className="input-inti w-full resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-[var(--color-accent)] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)]"
          >
            Create Organization
          </button>
        </form>
      </GlassCard>
    </div>
  )
}
