import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import type { Database } from '@/infrastructure/database/database.types'

vi.mock('@/shared/errors/error-reporting', () => ({ reportServerError: vi.fn() }))

import { validateDisplayName } from '@/modules/users/display-name'

function clientReturning(result: { data: Array<{ id: string }> | null; error: unknown }) {
  const ilike = vi.fn()
  const query = {
    select: () => query,
    ilike: (...args: unknown[]) => {
      ilike(...args)
      return query
    },
    limit: () => query,
    neq: () => query,
    then: (resolve: (value: typeof result) => void) => resolve(result),
  }
  return {
    client: { from: () => query } as unknown as SupabaseClient<Database>,
    ilike,
  }
}

describe('validateDisplayName', () => {
  it('rejects a name that is too short', async () => {
    const { client } = clientReturning({ data: [], error: null })

    expect(await validateDisplayName(client, ' a ')).toMatchObject({ ok: false })
  })

  it('rejects a name that is too long', async () => {
    const { client } = clientReturning({ data: [], error: null })

    expect(await validateDisplayName(client, 'x'.repeat(61))).toMatchObject({ ok: false })
  })

  it('rejects a name another account already uses', async () => {
    const { client } = clientReturning({ data: [{ id: 'other' }], error: null })

    expect(await validateDisplayName(client, 'owner')).toEqual({
      ok: false,
      message: 'That display name is already taken.',
    })
  })

  it('accepts a free name and returns it trimmed', async () => {
    const { client } = clientReturning({ data: [], error: null })

    expect(await validateDisplayName(client, '  Campus Admin ')).toEqual({
      ok: true,
      name: 'Campus Admin',
    })
  })

  it('compares the name literally by escaping like wildcards', async () => {
    const { client, ilike } = clientReturning({ data: [], error: null })

    await validateDisplayName(client, 'a_b%c')

    expect(ilike).toHaveBeenCalledWith('display_name', 'a\\_b\\%c')
  })

  it('refuses the name when the lookup fails', async () => {
    const { client } = clientReturning({ data: null, error: new Error('db down') })

    expect(await validateDisplayName(client, 'Campus Admin')).toMatchObject({ ok: false })
  })
})
