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

  const base =
    'inline-flex items-center px-3 py-1.5 font-sans text-[10px] font-medium tracking-[0.15em] uppercase transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:ring-offset-1'

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
      <button
        onClick={() => select('')}
        className={`${base} border ${
          !active
            ? 'bg-[#09090B] text-white border-[#09090B]'
            : 'bg-transparent text-[#71717A] border-[#E4E4E7] hover:border-[#09090B] hover:text-[#09090B]'
        }`}
        aria-pressed={!active}
      >
        All
      </button>

      {categories.map((cat) => {
        const isActive = active === cat.slug
        return (
          <button
            key={cat.id}
            onClick={() => select(cat.slug)}
            className={`${base} border ${
              isActive
                ? 'text-white'
                : 'bg-transparent text-[#71717A] border-[#E4E4E7] hover:border-[#09090B] hover:text-[#09090B]'
            }`}
            style={
              isActive
                ? { backgroundColor: cat.color ?? '#71717A', borderColor: cat.color ?? '#71717A' }
                : undefined
            }
            aria-pressed={isActive}
          >
            {cat.name}
          </button>
        )
      })}
    </div>
  )
}
