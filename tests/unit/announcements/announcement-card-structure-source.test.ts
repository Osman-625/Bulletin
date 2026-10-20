import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

function source(path: string) {
  return readFileSync(path, 'utf8')
}

function cssBlock(css: string, selector: string) {
  const start = css.indexOf(`${selector} {`)
  if (start === -1) throw new Error(`Missing ${selector}`)
  const end = css.indexOf('\n  }', start)
  if (end === -1) throw new Error(`Missing end for ${selector}`)
  return css.slice(start, end)
}

describe('standard announcement card structure', () => {
  it('defines and reuses every card slot in one stable order', () => {
    const card = source('src/components/announcements/AnnouncementCard.tsx')
    const slotNames = [
      'CardImage',
      'StatusBadge',
      'CardTitle',
      'CardDescription',
      'CardMetaInfo',
      'CardFooter',
    ]

    for (const slotName of slotNames) {
      expect(card).toContain(`function ${slotName}`)
    }

    const slotPositions = slotNames.map((slotName) => card.indexOf(`<${slotName}`))
    expect(slotPositions.every((position) => position >= 0)).toBe(true)
    expect(slotPositions).toEqual([...slotPositions].sort((a, b) => a - b))
    expect(card.match(/announcement-card-body/g)).toHaveLength(1)
    expect(card).not.toContain('function StandardCard')
    expect(card).not.toContain('function FeaturedCard')
  })

  it('always renders reserved status and metadata slots', () => {
    const card = source('src/components/announcements/AnnouncementCard.tsx')

    expect(card).toContain('data-slot="status"')
    expect(card).toContain("data-slot-empty={items.length === 0 ? 'true' : undefined}")
    expect(card).toContain('label="Posted"')
    expect(card).toContain('label="Deadline"')
    expect(card.match(/<EventMetaPill/g)).toHaveLength(2)
    expect(card).toContain("publishedAt ? formatCampusShortDate(publishedAt) : 'Pending'")
    expect(card).toContain("expiresAt ? deadlineLabel(expiresAt) : 'No deadline'")
  })

  it('uses fixed component rows, equal metadata boxes, and fixed image geometry', () => {
    const card = source('src/components/announcements/AnnouncementCard.tsx')
    const globals = source('src/app/globals.css')
    const body = cssBlock(globals, '.announcement-card-body')
    const status = cssBlock(globals, '.announcement-card-status')
    const title = cssBlock(globals, '.announcement-card-title')
    const description = cssBlock(globals, '.announcement-card-summary')
    const meta = cssBlock(globals, '.announcement-card-meta-grid')
    const metaBox = cssBlock(globals, '.announcement-card-meta-box')
    const footer = cssBlock(globals, '.announcement-card-footer')
    const badge = cssBlock(globals, '.announcement-card-chip')

    expect(body).toContain('display: grid')
    expect(body).toContain('grid-template-rows:')
    expect(body).toContain('var(--announcement-card-status-slot)')
    expect(body).toContain('var(--announcement-card-title-slot)')
    expect(body).toContain('var(--announcement-card-description-slot)')
    expect(body).toContain('var(--announcement-card-meta-slot)')
    expect(body).toContain('var(--announcement-card-footer-slot)')
    expect(body).not.toContain('minmax(0, 1fr)')
    expect(body).toContain('block-size: var(--announcement-card-body-height)')
    expect(status).toContain('block-size: var(--announcement-card-status-slot)')
    expect(status).toContain('flex-wrap: nowrap')
    expect(status).toContain('align-items: center')
    expect(status).toContain('gap: var(--announcement-card-badge-gap)')
    expect(globals).toContain('--announcement-card-status-row-height: 1.75rem')
    expect(globals).toContain('--announcement-card-badge-height: 1.5rem')
    expect(globals).toContain('--announcement-card-badge-gap: 0.45rem')
    expect(globals).toContain('--announcement-card-badge-padding-x: 0.75rem')
    expect(badge).toContain('block-size: var(--announcement-card-badge-height)')
    expect(badge).toContain('min-block-size: var(--announcement-card-badge-height)')
    expect(badge).toContain('justify-content: center')
    expect(badge).toContain('line-height: 1')
    expect(badge).toContain('padding-inline: var(--announcement-card-badge-padding-x)')
    expect(badge).toContain('padding-block: 0')
    expect(title).toContain('-webkit-line-clamp: 2')
    expect(title).toContain('block-size: var(--announcement-card-title-slot)')
    expect(description).toContain('-webkit-line-clamp: 3')
    expect(description).toContain('block-size: var(--announcement-card-description-slot)')
    expect(meta).toContain('grid-template-columns: repeat(2, minmax(0, 1fr))')
    expect(meta).toContain('block-size: var(--announcement-card-meta-slot)')
    expect(metaBox).toContain('block-size: 100%')
    expect(footer).toContain('grid-row: 5')
    expect(globals).toContain('block-size: var(--public-card-media-height)')
    expect(card).toContain('announcement-card-image-frame absolute inset-0')
    expect(card).toContain('announcement-card-image block object-contain object-center')
    expect(card).toContain("style={{ objectFit: 'contain' }}")
    expect(card).not.toContain(
      'announcement-card-image block object-cover object-center transition-transform'
    )
  })
})
