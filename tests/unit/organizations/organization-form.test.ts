import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { readOrganizationFormData } from '@/modules/organizations/validation'

function source(path: string) {
  return readFileSync(path, 'utf8')
}

function formData(entries: Record<string, string>) {
  const data = new FormData()
  Object.entries(entries).forEach(([key, value]) => data.set(key, value))
  return data
}

describe('readOrganizationFormData', () => {
  it('trims organization fields and normalizes slugs', () => {
    const result = readOrganizationFormData(
      formData({
        name: '  Photography Club  ',
        slug: '  Photography Club!! 2026  ',
        description: '  Campus photo walks  ',
        org_type: 'club',
      })
    )

    expect(result).toEqual({
      ok: true,
      data: {
        name: 'Photography Club',
        slug: 'photography-club-2026',
        description: 'Campus photo walks',
        org_type: 'club',
      },
    })
  })

  it('falls back to the organization name when slug is blank', () => {
    const result = readOrganizationFormData(
      formData({
        name: 'Student Affairs',
        slug: '   ',
        description: '',
        org_type: 'department',
      })
    )

    expect(result).toEqual({
      ok: true,
      data: {
        name: 'Student Affairs',
        slug: 'student-affairs',
        description: null,
        org_type: 'department',
      },
    })
  })

  it('rejects invalid organization types before database writes', () => {
    const result = readOrganizationFormData(
      formData({
        name: 'Bad Actor',
        slug: 'bad-actor',
        description: '',
        org_type: 'owner',
      })
    )

    expect(result).toEqual({
      ok: false,
      error: 'Choose a valid organization type.',
    })
  })

  it('renders organization type options from the shared validation config', () => {
    const validationSource = source('src/lib/organizations/validation.ts')
    const newOrgPage = source('src/app/(admin)/admin/orgs/new/page.tsx')

    expect(validationSource).toContain('export const ORGANIZATION_TYPE_OPTIONS')
    expect(newOrgPage).toContain('ORGANIZATION_TYPE_OPTIONS.map')
    expect(newOrgPage).not.toContain('<option value="club">Club</option>')
    expect(newOrgPage).not.toContain('<option value="department">Department</option>')
  })

  it('rejects empty names and unusable slugs', () => {
    expect(
      readOrganizationFormData(
        formData({ name: ' ', slug: 'valid-slug', description: '', org_type: 'club' })
      )
    ).toEqual({ ok: false, error: 'Organization name is required.' })

    expect(
      readOrganizationFormData(
        formData({ name: '!!!', slug: '!!!', description: '', org_type: 'club' })
      )
    ).toEqual({ ok: false, error: 'Organization slug must include letters or numbers.' })
  })

  it('rejects descriptions that are too long', () => {
    const result = readOrganizationFormData(
      formData({
        name: 'Writing Society',
        slug: 'writing-society',
        description: 'a'.repeat(501),
        org_type: 'society',
      })
    )

    expect(result).toEqual({
      ok: false,
      error: 'Organization description must be 500 characters or fewer.',
    })
  })
})
