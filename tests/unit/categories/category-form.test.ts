import { describe, expect, it } from 'vitest'
import {
  DEFAULT_CATEGORY_COLOR,
  readCategoryFormData,
  normalizeCategorySlug,
} from '@/modules/categories/validation'

function formData(entries: Record<string, string>) {
  const data = new FormData()
  Object.entries(entries).forEach(([key, value]) => data.set(key, value))
  return data
}

describe('category form validation', () => {
  it('trims names, normalizes slugs, and accepts hex colors', () => {
    expect(normalizeCategorySlug(' Student Life!! 2026 ')).toBe('student-life-2026')
    expect(
      readCategoryFormData(
        formData({
          name: '  Student Life  ',
          color: '#A1b2C3',
        })
      )
    ).toEqual({
      ok: true,
      data: {
        name: 'Student Life',
        slug: 'student-life',
        color: '#A1b2C3',
      },
    })
  })

  it('rejects empty names and unusable slugs before database writes', () => {
    expect(readCategoryFormData(formData({ name: ' ', color: '#C8102E' }))).toEqual({
      ok: false,
      error: 'Category name is required.',
    })

    expect(readCategoryFormData(formData({ name: '!!!', color: '#C8102E' }))).toEqual({
      ok: false,
      error: 'Category name must include letters or numbers.',
    })
  })

  it('rejects invalid colors and defaults missing colors to the design token red', () => {
    expect(readCategoryFormData(formData({ name: 'Academic', color: 'red' }))).toEqual({
      ok: false,
      error: 'Choose a valid category color.',
    })

    expect(readCategoryFormData(formData({ name: 'Academic', color: '' }))).toEqual({
      ok: true,
      data: {
        name: 'Academic',
        slug: 'academic',
        color: DEFAULT_CATEGORY_COLOR,
      },
    })
  })
})
