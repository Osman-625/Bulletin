export const ORGANIZATION_TYPE_OPTIONS = [
  { value: 'club', label: 'Club' },
  { value: 'department', label: 'Department' },
  { value: 'society', label: 'Society' },
  { value: 'faculty', label: 'Faculty' },
  { value: 'other', label: 'Other' },
] as const

export type OrganizationType = (typeof ORGANIZATION_TYPE_OPTIONS)[number]['value']

export type OrganizationFormData = {
  name: string
  slug: string
  description: string | null
  org_type: OrganizationType
}

export type OrganizationFormResult =
  | { ok: true; data: OrganizationFormData }
  | { ok: false; error: string }

const ORGANIZATION_TYPE_SET = new Set<string>(
  ORGANIZATION_TYPE_OPTIONS.map((option) => option.value)
)

function readString(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

export function normalizeOrganizationSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 80)
}

export function readOrganizationFormData(formData: FormData): OrganizationFormResult {
  const name = readString(formData, 'name').replace(/\s+/g, ' ')
  if (!name) return { ok: false, error: 'Organization name is required.' }
  if (name.length > 120) {
    return { ok: false, error: 'Organization name must be 120 characters or fewer.' }
  }

  const rawSlug = readString(formData, 'slug') || name
  const slug = normalizeOrganizationSlug(rawSlug)
  if (!slug) return { ok: false, error: 'Organization slug must include letters or numbers.' }

  const description = readString(formData, 'description') || null
  if (description && description.length > 500) {
    return { ok: false, error: 'Organization description must be 500 characters or fewer.' }
  }

  const orgType = readString(formData, 'org_type')
  if (!ORGANIZATION_TYPE_SET.has(orgType)) {
    return { ok: false, error: 'Choose a valid organization type.' }
  }

  return {
    ok: true,
    data: {
      name,
      slug,
      description,
      org_type: orgType as OrganizationType,
    },
  }
}
