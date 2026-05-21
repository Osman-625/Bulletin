'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { captureProductEvent } from '@/lib/product-analytics'
import type { DbCategory } from '@/lib/types'

export default function CategoryFilter({ categories }: { categories: DbCategory[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const active = searchParams.get('category') ?? ''

  function select(slug: string) {
    captureProductEvent('public_feed_category_selected', {
      category: slug || 'all',
      previous_category: active || 'all',
    })

    const params = new URLSearchParams(searchParams.toString())
    if (slug) params.set('category', slug)
    else params.delete('category')
    params.delete('page')
    const query = params.toString()
    router.push(query ? `/?${query}` : '/')
  }

  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:pb-0 [&::-webkit-scrollbar]:hidden"
      role="group"
      aria-label="Filter by category"
    >
      {/* All */}
      <button
        type="button"
        data-category=""
        onClick={() => select('')}
        className="tab-lift inline-flex min-h-11 shrink-0 cursor-pointer items-center rounded-[10px] border px-3.5 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-inti)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-canvas)]"
        style={{
          ...(!active
            ? {
                background: 'var(--color-text-primary)',
                borderColor: 'var(--color-text-primary)',
                color: 'var(--color-canvas)',
              }
            : {
                background: 'var(--color-surface-elevated)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-muted)',
              }),
        }}
        aria-pressed={!active}
      >
        All
      </button>

      {categories.length === 0 && (
        <span className="inline-flex min-h-11 shrink-0 items-center rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3.5 text-sm font-semibold text-[var(--color-text-muted)]">
          No topics available yet
        </span>
      )}

      {/* Category tabs */}
      {categories.map((cat) => {
        const isActive = active === cat.slug
        const color = cat.color ?? '#C8102E'
        return (
          <button
            type="button"
            data-category={cat.slug}
            key={cat.id}
            onClick={() => select(cat.slug)}
            className="tab-lift inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-[10px] border px-3.5 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-inti)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-canvas)]"
            style={{
              ...(isActive
                ? {
                    background: `color-mix(in oklab, ${color} 18%, var(--color-surface))`,
                    borderColor: `color-mix(in oklab, ${color} 45%, var(--color-border))`,
                    color: 'var(--color-text-primary)',
                    boxShadow: `0 2px 10px color-mix(in oklab, ${color} 18%, transparent)`,
                  }
                : {
                    background: 'var(--color-surface-elevated)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-muted)',
                  }),
            }}
            aria-pressed={isActive}
          >
            <span
              className="h-2 w-2 flex-shrink-0 rounded-full"
              style={{ background: color }}
              aria-hidden="true"
            />
            <span className="sr-only">Category: </span>
            {cat.name}
          </button>
        )
      })}
    </div>
  )
}
