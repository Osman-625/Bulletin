import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import type { Database } from '@/infrastructure/database/database.types'

vi.mock('@/shared/errors/error-reporting', () => ({ reportServerError: vi.fn() }))

import { getSharedOrganizationBlocker, getUserDeleteBlocker } from '@/modules/users/delete-guard'

// Every table answers with the count/rows given for it; unknown tables count zero.
function fakeClient(
  counts: Record<string, number>,
  options: { failTable?: string; memberships?: string[] } = {}
) {
  return {
    from: (table: string) => ({
      select: () => ({
        eq: () =>
          table === 'organization_members'
            ? Promise.resolve({
                data: (options.memberships ?? []).map((organization_id) => ({ organization_id })),
                error: null,
              })
            : Promise.resolve({
                count: counts[table] ?? 0,
                error: options.failTable === table ? new Error('db down') : null,
              }),
      }),
    }),
  } as unknown as SupabaseClient<Database>
}

describe('getUserDeleteBlocker', () => {
  it('allows deleting a user with nothing on record', async () => {
    expect(await getUserDeleteBlocker(fakeClient({}), 'u1')).toBeNull()
  })

  it('blocks a user who has written an announcement', async () => {
    expect(await getUserDeleteBlocker(fakeClient({ announcements: 3 }), 'u1')).toContain(
      "can't be deleted"
    )
  })

  it('blocks a user who reviewed an announcement', async () => {
    expect(await getUserDeleteBlocker(fakeClient({ announcement_reviews: 1 }), 'u1')).toContain(
      "can't be deleted"
    )
  })

  it('refuses the delete when a lookup fails', async () => {
    expect(
      await getUserDeleteBlocker(fakeClient({}, { failTable: 'invitations' }), 'u1')
    ).toContain('Could not check')
  })
})

describe('getSharedOrganizationBlocker', () => {
  it('allows a publisher who only belongs to the admin organizations', async () => {
    const client = fakeClient({}, { memberships: ['org-a'] })

    expect(await getSharedOrganizationBlocker(client, 'u1', ['org-a', 'org-b'])).toBeNull()
  })

  it('blocks a publisher who also belongs to another organization', async () => {
    const client = fakeClient({}, { memberships: ['org-a', 'org-z'] })

    expect(await getSharedOrganizationBlocker(client, 'u1', ['org-a'])).toContain('outside yours')
  })
})
