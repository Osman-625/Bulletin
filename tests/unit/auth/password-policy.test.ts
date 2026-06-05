import { describe, expect, it } from 'vitest'
import {
  TEMPORARY_PASSWORD_MIN_LENGTH,
  TEMPORARY_PASSWORD_REQUIREMENT,
  validateTemporaryPassword,
} from '@/lib/auth/password-policy'

describe('temporary password policy', () => {
  it('requires privileged temporary passwords to be at least 12 characters', () => {
    expect(TEMPORARY_PASSWORD_MIN_LENGTH).toBe(12)
    expect(TEMPORARY_PASSWORD_REQUIREMENT).toBe(
      'Temporary password must be at least 12 characters.'
    )
  })

  it('rejects missing and short temporary passwords with the shared message', () => {
    expect(validateTemporaryPassword(null)).toEqual({
      valid: false,
      message: TEMPORARY_PASSWORD_REQUIREMENT,
    })
    expect(validateTemporaryPassword('12345678901')).toEqual({
      valid: false,
      message: TEMPORARY_PASSWORD_REQUIREMENT,
    })
  })

  it('accepts temporary passwords that meet the shared length requirement', () => {
    expect(validateTemporaryPassword('123456789012')).toEqual({ valid: true })
  })
})
