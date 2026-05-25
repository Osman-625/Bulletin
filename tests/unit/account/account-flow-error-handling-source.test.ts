import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const accountFlowActions = [
  'src/app/(auth)/forgot-password/actions.ts',
  'src/app/change-password/actions.ts',
  'src/app/(admin)/admin/publishers/invite/actions.ts',
  'src/app/(super-admin)/super-admin/admins/invite/actions.ts',
  'src/app/register/actions.ts',
]

function source(path: string) {
  return readFileSync(path, 'utf8')
}

describe('account flow write error handling source guards', () => {
  it.each(accountFlowActions)('%s logs failures without exposing backend messages', (path) => {
    const file = source(path)

    expect(file).toContain("from '@/lib/error-reporting'")
    expect(file).toContain('reportServerError(')
    expect(file).not.toContain('encodeURIComponent(error.message)')
    expect(file).not.toContain('encodeURIComponent(createErr?.message')
  })

  it('checks password recovery and password change Supabase write failures', () => {
    const recovery = source('src/app/(auth)/forgot-password/actions.ts')
    const changePassword = source('src/app/change-password/actions.ts')

    expect(recovery).toContain('profileReadError')
    expect(recovery).toContain('existingRequestReadError')
    expect(recovery).toContain('requestUpdateError')
    expect(recovery).toContain('requestCreateError')
    expect(recovery).toContain('resetManagersError')

    expect(changePassword).toContain('authUpdateError')
    expect(changePassword).toContain('profileUpdateError')
    expect(changePassword).toContain('profileReadError')
  })

  it('checks invite and registration write failures before success redirects', () => {
    const publisherInvite = source('src/app/(admin)/admin/publishers/invite/actions.ts')
    const adminInvite = source('src/app/(super-admin)/super-admin/admins/invite/actions.ts')
    const registration = source('src/app/register/actions.ts')

    expect(publisherInvite).toContain('INVITE_CREATE_ERROR')
    expect(publisherInvite).toContain('invitationError')
    expect(adminInvite).toContain('INVITE_CREATE_ERROR')
    expect(adminInvite).toContain('invitationError')

    expect(registration).toContain('REGISTRATION_ERROR')
    expect(registration).toContain('authCreateError')
    expect(registration).toContain('profileUpsertError')
    expect(registration).toContain('membershipInsertError')
    expect(registration).toContain('invitationAcceptError')
    expect(registration).toContain('cleanupCreatedAuthUser')
  })

  it('does not send invitation bearer tokens to server error reporting', () => {
    const registration = source('src/app/register/actions.ts')
    const errorReports = registration.match(/reportServerError\([\s\S]*?\)/g) ?? []

    expect(registration).not.toContain('{ token }')
    expect(errorReports.join('\n')).not.toContain('token')
  })
})
