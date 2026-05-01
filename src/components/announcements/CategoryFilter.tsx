'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import type { DbCategory } from '@/lib/types'


export default function CategoryFilter({ categories }: { categories: DbCategory[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const active = searchParams.get('category') ?? ''

  function select(slug: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (slug) params.set('category', slug)
    else params.delete('category')
    router.push(`/?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
      {/* All */}
      <button
        onClick={() => select('')}
        className="tab-lift inline-flex cursor-pointer items-center rounded-[10px] border px-4 py-[9px] text-[13px] font-medium focus:outline-none focus-visible:ring-2"
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

      {/* Category tabs */}
      {categories.map((cat) => {
        const isActive = active === cat.slug
        const color = cat.color ?? '#C8102E'
        return (
          <button
            key={cat.id}
            onClick={() => select(cat.slug)}
            className="tab-lift inline-flex cursor-pointer items-center gap-2 rounded-[10px] border px-4 py-[9px] text-[13px] font-medium focus:outline-none focus-visible:ring-2"
            style={{
              ...(isActive
                ? {
                    background: color,
                    borderColor: color,
                    color: '#FFFFFF',
                    boxShadow: `0 2px 10px ${color}40`,
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
              className="h-2 w-2 rounded-full flex-shrink-0"
              style={{ background: isActive ? 'rgba(255,255,255,0.7)' : color }}
              aria-hidden="true"
            />
            {cat.name}
          </button>
        )
      })}
    </div>
  )
}
