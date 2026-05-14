import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  brandDirections,
  brandLabResearchAnchors,
  selectedBrandDirection,
} from '../../src/lib/brand-lab/directions'

describe('brand lab system', () => {
  it('keeps three distinct concept directions with a Future Commons production recommendation', () => {
    expect(brandDirections).toHaveLength(3)
    expect(brandDirections.map((direction) => direction.slug)).toEqual([
      'campus-press',
      'signal-atlas',
      'future-commons',
    ])
    expect(selectedBrandDirection.slug).toBe('future-commons')
  })

  it('uses original Bulletin companion marks rather than official INTI logo copies', () => {
    for (const direction of brandDirections) {
      expect(direction.assets.usesOfficialIntiLogo).toBe(false)
      expect(direction.assets.markSrc).toMatch(/^\/brand-lab\/.+\.svg$/)
      expect(direction.palette.accent.toLowerCase()).toBe('#c8102e')
    }
  })

  it('documents research anchors and the selected implementation plan', () => {
    const directionsDoc = readFileSync('docs/brand/bulletin-brand-directions.md', 'utf8')
    const systemDoc = readFileSync('docs/brand/bulletin-design-system.md', 'utf8')

    expect(brandLabResearchAnchors.length).toBeGreaterThanOrEqual(6)
    expect(directionsDoc).toContain('INTI International University')
    expect(directionsDoc).toContain('Future Commons')
    expect(systemDoc).toContain('Selected direction: **Future Commons**')
    expect(systemDoc).toContain('Final Implementation Plan')
  })
})
