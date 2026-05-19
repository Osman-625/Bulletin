import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

function source(path: string) {
  return readFileSync(path, 'utf8')
}

describe('login action error handling source guards', () => {
  it('logs Supabase login failures without exposing backend messages', () => {
    const actions = source('src/app/(auth)/login/actions.ts')

    expect(actions).toContain("from '@/lib/error-reporting'")
    expect(actions).toContain('reportServerError(')
    expect(actions).toContain('usernameLookupError')
    expect(actions).toContain('signInError')
    expect(actions).toContain('userReadError')
    expect(actions).toContain('profileReadError')
    expect(actions).toContain('profileSynced')
    expect(actions).not.toContain('error.message')
  })

  it('checks logout user lookup and sign out failures before redirecting', () => {
    const actions = source('src/app/(auth)/login/actions.ts')

    expect(actions).toContain('logoutUserReadError')
    expect(actions).toContain('signOutError')
    expect(actions).toContain("reportServerError('auth.logout.user_read_failed'")
    expect(actions).toContain("reportServerError('auth.logout.sign_out_failed'")
  })
})
