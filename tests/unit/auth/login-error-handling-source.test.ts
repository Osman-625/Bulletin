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

  it('does not let missing usernames skip the auth password check path', () => {
    const actions = source('src/app/(auth)/login/actions.ts')
    const usernameLookupIndex = actions.indexOf("select('email')")
    const signInIndex = actions.indexOf('signInWithPassword')

    expect(actions).toContain('AUTH_TIMING_DUMMY_EMAIL')
    expect(actions).toContain('.maybeSingle()')
    expect(actions).not.toContain("if (!match?.email) redirect('/login?error=invalid_credentials')")
    expect(usernameLookupIndex).toBeGreaterThan(-1)
    expect(signInIndex).toBeGreaterThan(-1)
    expect(usernameLookupIndex).toBeLessThan(signInIndex)
  })

  it('checks logout user lookup and sign out failures before redirecting', () => {
    const actions = source('src/app/(auth)/login/actions.ts')

    expect(actions).toContain('logoutUserReadError')
    expect(actions).toContain('signOutError')
    expect(actions).toContain("reportServerError('auth.logout.user_read_failed'")
    expect(actions).toContain("reportServerError('auth.logout.sign_out_failed'")
  })
})
