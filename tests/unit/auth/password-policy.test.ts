import { describe, expect, it } from 'vitest'
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_REQUIREMENT,
  TEMPORARY_PASSWORD_MIN_LENGTH,
  TEMPORARY_PASSWORD_REQUIREMENT,
  validatePassword,
  validateTemporaryPassword,
} from '@/lib/auth/password-policy'

describe('temporary password policy', () => {
  it('requires all application passwords to be at least 12 characters', () => {
    expect(PASSWORD_MIN_LENGTH).toBe(12)
    expect(PASSWORD_REQUIREMENT).toBe('Password must be at least 12 characters.')
  })

  it('rejects missing and short account passwords with the shared message', () => {
    expect(validatePassword(null)).toEqual({
      valid: false,
      message: PASSWORD_REQUIREMENT,
    })
    expect(validatePassword('12345678901')).toEqual({
      valid: false,
      message: PASSWORD_REQUIREMENT,
    })
  })

  it('accepts account passwords that meet the shared length requirement', () => {
    expect(validatePassword('123456789012')).toEqual({ valid: true })
  })

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
