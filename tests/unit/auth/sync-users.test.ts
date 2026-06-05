import type { User } from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'

import { authUserToProfileInsert } from '@/lib/auth/sync-users'

function authUserWithMetadata(
  userMetadata: User['user_metadata'],
  overrides: Partial<Pick<User, 'id' | 'email'>> = {}
): User {
  return {
    id: overrides.id ?? '11111111-1111-4111-8111-111111111111',
    email: overrides.email ?? 'publisher@example.edu',
    user_metadata: userMetadata,
  } as User
}

describe('auth user profile sync', () => {
  it('defaults missing profiles to publisher even when auth metadata requests a privileged role', () => {
    const row = authUserToProfileInsert(
      authUserWithMetadata({
        display_name: 'Campus Admin',
        role: 'owner',
      })
    )

    expect(row).toMatchObject({
      email: 'publisher@example.edu',
      display_name: 'Campus Admin',
      role: 'publisher',
      force_password_change: false,
    })
  })

  it('keeps non-authorization profile metadata while ignoring role metadata', () => {
    const row = authUserToProfileInsert(
      authUserWithMetadata(
        {
          full_name: 'New Publisher',
          role: 'super_admin',
        },
        { email: 'new.publisher@example.edu' }
      )
    )

    expect(row.display_name).toBe('New Publisher')
    expect(row.role).toBe('publisher')
  })
})
