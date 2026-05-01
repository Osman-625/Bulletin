'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import type { DbCategory } from '@/lib/types'

const PILL_TRANSITION = 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'

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
        className="inline-flex cursor-pointer items-center rounded-full border px-4 py-1.5 text-[11px] font-semibold tracking-[0.07em] uppercase focus:outline-none focus-visible:ring-2 active:scale-[0.97]"
        style={{
          transition: PILL_TRANSITION,
          ...(!active
            ? {
                background: 'var(--color-text-primary)',
                borderColor: 'var(--color-text-primary)',
                color: 'var(--color-canvas)',
              }
            : {
                background: 'transparent',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-muted)',
              }),
        }}
        aria-pressed={!active}
      >
        All
      </button>

      {/* Category pills */}
      {categories.map((cat) => {
        const isActive = active === cat.slug
        const color = cat.color ?? '#C8102E'
        return (
          <button
            key={cat.id}
            onClick={() => select(cat.slug)}
            className="inline-flex cursor-pointer items-center rounded-full border px-4 py-1.5 text-[11px] font-semibold tracking-[0.07em] uppercase focus:outline-none focus-visible:ring-2 active:scale-[0.97]"
            style={{
              transition: PILL_TRANSITION,
              ...(isActive
                ? {
                    background: color,
                    borderColor: color,
                    color: '#FFFFFF',
                    boxShadow: `0 2px 10px ${color}45`,
                  }
                : {
                    background: 'transparent',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-muted)',
                  }),
            }}
            aria-pressed={isActive}
          >
            {cat.name}
          </button>
        )
      })}
    </div>
  )
}
