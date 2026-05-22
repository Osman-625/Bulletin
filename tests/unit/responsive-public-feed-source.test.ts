import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

function source(path: string) {
  return readFileSync(path, 'utf8')
}

describe('public feed responsive adaptation source guards', () => {
  it('uses a compact public header on mobile instead of the oversized desktop masthead', () => {
    const header = source('src/components/layout/Header.tsx')

    expect(header).not.toContain('min-h-[6.25rem]')
    expect(header).not.toContain('sm:min-h-28')
    expect(header).toContain('size="md"')
  })

  it('keeps the mobile hero compact and gives tablet a dedicated two-column layout', () => {
    const publicHome = source('src/app/(public)/page.tsx')

    expect(publicHome).toContain('md:grid-cols-[minmax(0,1.45fr)_minmax(15rem,0.75fr)]')
    expect(publicHome).not.toContain('text-6xl leading-[0.9]')
    expect(publicHome).toContain('text-4xl leading-[0.95]')
    expect(publicHome).toContain('public-mobile-metrics')
    expect(publicHome).not.toContain('hidden gap-3 sm:grid sm:grid-cols-3')
  })

  it('keeps search and filters reachable and exposes sort controls on mobile', () => {
    const publicHome = source('src/app/(public)/page.tsx')
    const globals = source('src/app/globals.css')

    expect(publicHome).toContain('mobile-search-dock')
    expect(globals).toContain('.mobile-search-dock')
    expect(publicHome).toContain('public-board-sort')
    expect(publicHome).not.toContain('public-page-reveal future-bento-cell hidden gap-4')
    expect(publicHome).toContain('[&::-webkit-scrollbar]:hidden')
    expect(publicHome).toContain('lg:grid-cols-[minmax(16rem,0.55fr)_minmax(0,1fr)]')
  })

  it('keeps secondary live-board chrome off phones and strengthens urgent cards through CSS', () => {
    const publicHome = source('src/app/(public)/page.tsx')
    const globals = source('src/app/globals.css')

    expect(publicHome).toContain('public-page-reveal future-bento-cell hidden')
    expect(publicHome).toContain('md:block')
    expect(publicHome).not.toContain('border-l-4')
    expect(publicHome).toContain('urgent-bento-item')
    expect(globals).toContain(".urgent-bento-item [data-testid='announcement-card']")
  })
})
