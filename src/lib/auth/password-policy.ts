export const PASSWORD_MIN_LENGTH = 12
export const PASSWORD_REQUIREMENT = `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`

export const TEMPORARY_PASSWORD_MIN_LENGTH = PASSWORD_MIN_LENGTH
export const TEMPORARY_PASSWORD_REQUIREMENT = `Temporary password must be at least ${TEMPORARY_PASSWORD_MIN_LENGTH} characters.`

export type PasswordValidation = { valid: true } | { valid: false; message: string }

export function validatePassword(
  value: FormDataEntryValue | string | null | undefined,
  minLength = PASSWORD_MIN_LENGTH
): PasswordValidation {
  const password = typeof value === 'string' ? value : ''

  if (password.length < minLength) {
    return {
      valid: false,
      message:
        minLength === PASSWORD_MIN_LENGTH
          ? PASSWORD_REQUIREMENT
          : `Password must be at least ${minLength} characters.`,
    }
  }

  return { valid: true }
}

export function validateTemporaryPassword(
  value: FormDataEntryValue | string | null | undefined,
  minLength = TEMPORARY_PASSWORD_MIN_LENGTH
): PasswordValidation {
  const password = typeof value === 'string' ? value : ''

  if (password.length < minLength) {
    return {
      valid: false,
      message:
        minLength === TEMPORARY_PASSWORD_MIN_LENGTH
          ? TEMPORARY_PASSWORD_REQUIREMENT
          : `Temporary password must be at least ${minLength} characters.`,
    }
  }

  return { valid: true }
}
