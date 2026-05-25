import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

function source(path: string) {
  return readFileSync(path, 'utf8')
}

describe('organization data source guards', () => {
  it('disambiguates organization owner profiles from approver profiles', () => {
    const data = source('src/lib/data.ts')
    const orgsPage = source('src/app/(admin)/admin/orgs/page.tsx')
    const types = source('src/lib/types.ts')

    expect(data).toContain('owner:users!organizations_owner_id_fkey ( display_name, email )')
    expect(data).not.toContain("select('*, users ( display_name, email )')")
    expect(types).toContain('export type OrgWithOwner')
    expect(orgsPage).toContain('org.owner?.display_name')
    expect(orgsPage).not.toContain('org as { users?:')
  })
})
