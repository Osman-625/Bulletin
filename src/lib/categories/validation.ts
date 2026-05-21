export const DEFAULT_CATEGORY_COLOR = '#C8102E'
export const CATEGORY_NAME_MAX = 80

export type CategoryFormData = {
  name: string
  slug: string
  color: string
}

export type CategoryFormResult = { ok: true; data: CategoryFormData } | { ok: false; error: string }

function readString(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

export function normalizeCategorySlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, CATEGORY_NAME_MAX)
}

export function readCategoryFormData(formData: FormData): CategoryFormResult {
  const name = readString(formData, 'name').replace(/\s+/g, ' ')
  if (!name) return { ok: false, error: 'Category name is required.' }
  if (name.length > CATEGORY_NAME_MAX) {
    return { ok: false, error: `Category name must be ${CATEGORY_NAME_MAX} characters or fewer.` }
  }

  const slug = normalizeCategorySlug(name)
  if (!slug) return { ok: false, error: 'Category name must include letters or numbers.' }

  const color = readString(formData, 'color') || DEFAULT_CATEGORY_COLOR
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
    return { ok: false, error: 'Choose a valid category color.' }
  }

  return {
    ok: true,
    data: {
      name,
      slug,
      color,
    },
  }
}
