import Link from 'next/link'
import { BrandMark } from '@/components/layout/BrandMark'

export function PublicEmptyState({
  category,
  search,
}: {
  category?: string | null
  search?: string
}) {
  return (
    <div className="public-page-reveal future-bento-cell flex min-h-[38vh] flex-col items-center justify-center rounded-[1.75rem] px-5 py-16 text-center lg:min-h-[22rem]">
      <BrandMark size="lg" showText={false} className="campus-logo-halo mb-6 rounded-[1.35rem]" />
      <p className="font-display text-4xl leading-tight font-bold text-[var(--color-text-primary)] sm:text-5xl">
        {search
          ? 'No matching notices'
          : category
            ? 'No notices in this topic'
            : 'The board is quiet'}
      </p>
      <p className="mt-4 max-w-[30rem] text-base leading-8 text-[var(--color-text-muted)]">
        {search
          ? `Nothing matches "${search}". Try a different term or clear your filters.`
          : category
            ? `No notices in ${category} right now. Browse all topics to keep scanning.`
            : 'Check back tomorrow for new campus updates.'}
      </p>
      {(search || category) && (
        <Link
          href="/"
          className="action-lift mt-6 inline-flex min-h-12 items-center rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 text-base font-semibold text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-inti)]"
        >
          Browse all
        </Link>
      )}
    </div>
  )
}
