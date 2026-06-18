import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const accountActionsPath = 'src/lib/account/actions.ts'

function source(path: string) {
  return readFileSync(path, 'utf8')
}

describe('account settings write error handling source guards', () => {
  it('logs settings write failures without exposing backend messages', () => {
    const actions = source(accountActionsPath)

    expect(actions).toContain("from '@/shared/errors/error-reporting'")
    expect(actions).toContain('reportServerError(')
    expect(actions).toContain('ACCOUNT_PROFILE_ERROR')
    expect(actions).toContain('ACCOUNT_PASSWORD_ERROR')
    expect(actions).not.toContain('profileError.message')
    expect(actions).not.toContain('updateError.message')
  })

  it('checks profile and password update results before showing success', () => {
    const actions = source(accountActionsPath)

    expect(actions).toContain('userReadError')
    expect(actions).toContain('profileReadError')
    expect(actions).toContain('profileUpdateError')
    expect(actions).toContain('authMetadataUpdateError')
    expect(actions).toContain('authPasswordUpdateError')
    expect(actions).toContain('forcePasswordChangeError')
  })
})
