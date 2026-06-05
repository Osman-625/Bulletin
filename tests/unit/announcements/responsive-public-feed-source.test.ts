import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

function source(path: string) {
  return readFileSync(path, 'utf8')
}

describe('public feed responsive adaptation source guards', () => {
  it('uses a compact public header on mobile instead of the oversized desktop masthead', () => {
    const header = source('src/components/layout/Header.tsx')

    expect(header).toContain('aria-label="Public navigation"')
    expect(header).toContain('min-h-16')
    expect(header).not.toContain('min-h-[6.25rem]')
    expect(header).not.toContain('min-h-14')
    expect(header).not.toContain('sm:min-h-28')
    expect(header).not.toContain('sm:min-h-20')
    expect(header).toContain('size="md"')
    expect(header).toContain('[&_p:last-child]:hidden')
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
    const boardOrderControls = source('src/components/public/BoardOrderControls.tsx')
    const globals = source('src/app/globals.css')

    expect(publicHome).toContain('mobile-search-dock')
    expect(globals).toContain('.mobile-search-dock')
    expect(boardOrderControls).toContain('public-board-sort')
    expect(publicHome).not.toContain('public-page-reveal future-bento-cell hidden gap-4')
    expect(boardOrderControls).toContain('[&::-webkit-scrollbar]:hidden')
    expect(boardOrderControls).toContain('lg:grid-cols-[minmax(16rem,0.55fr)_minmax(0,1fr)]')
  })

  it('keeps secondary live-board chrome off phones and strengthens urgent cards through CSS', () => {
    const publicHome = source('src/app/(public)/page.tsx')
    const globals = source('src/app/globals.css')

    expect(publicHome).toContain('public-page-reveal future-bento-cell hidden')
    expect(publicHome).toContain('md:block')
    expect(publicHome).not.toContain('border-l-4')
    expect(publicHome).toContain('urgent-bento-item')
    expect(globals).toContain(".urgent-bento-item [data-testid='announcement-card']")
    expect(globals).toContain('urgent-bento-corner')
    expect(globals).not.toContain('width: 3px')
  })

  it('uses separate uniform rhythms for image and no-image announcement cards', () => {
    const publicHome = source('src/app/(public)/page.tsx')
    const card = source('src/components/announcements/AnnouncementCard.tsx')
    const globals = source('src/app/globals.css')

    expect(publicHome).toContain('uniform-card-board')
    expect(publicHome).toContain('bentoTileClass(announcement)')
    expect(publicHome).toContain('card-with-image')
    expect(publicHome).toContain('card-without-image')
    expect(publicHome).not.toContain("classes.push('dense-bento-tall')")
    expect(publicHome).not.toContain("classes.push('dense-bento-compact')")
    expect(publicHome).not.toContain('const variants: AnnouncementCardVisual[]')
    expect(card).toContain('{banner_url && (')
    expect(card).not.toContain('announcement-card-fallback')
    expect(card).toContain('data-uniform-card="true"')
    expect(card).not.toContain('min-h-[26rem]')
    expect(card).not.toContain('min-h-[18rem]')
    expect(globals).toContain('.uniform-card-board')
    expect(globals).toContain('.uniform-card-board > .card-with-image')
    expect(globals).toContain('.uniform-card-board > .card-without-image')
    expect(globals).toContain('grid-row: span 2')
    expect(globals).toContain('grid-row: span 1')
    expect(globals).toContain('--dense-bento-row: 20rem')
    expect(globals).toContain('.dense-bento-board .card-with-image')
    expect(globals).toContain('.dense-bento-board .card-without-image')
    expect(globals).toContain('.priority-lane-board.uniform-card-board .dense-bento-item')
    expect(globals).toContain('grid-column: auto')
    expect(globals).not.toContain('.priority-lane-board .dense-bento-item:only-child')
    expect(globals).not.toContain(
      '.priority-lane-board .dense-bento-item:first-child:nth-last-child(2)'
    )
    expect(globals).not.toContain("[data-uniform-card='true'] {\n    min-height: 24rem;")
    expect(globals).not.toContain('.dense-bento-board .dense-bento-tall')
  })

  it('keeps image cards tall enough for readable descriptions instead of letting media crush text', () => {
    const globals = source('src/app/globals.css')

    expect(globals).toContain(".card-with-image [data-has-image='true'] .announcement-card-summary")
    expect(globals).toContain('-webkit-line-clamp: 3')
    expect(globals).toContain('.dense-bento-board .card-with-image [data-card-media]')
    expect(globals).toContain('flex: 1 1 auto')
  })
})
