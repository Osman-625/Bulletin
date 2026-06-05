export const TEMPORARY_PASSWORD_MIN_LENGTH = 12
export const TEMPORARY_PASSWORD_REQUIREMENT = `Temporary password must be at least ${TEMPORARY_PASSWORD_MIN_LENGTH} characters.`

export type TemporaryPasswordValidation = { valid: true } | { valid: false; message: string }

export function validateTemporaryPassword(
  value: FormDataEntryValue | string | null | undefined,
  minLength = TEMPORARY_PASSWORD_MIN_LENGTH
): TemporaryPasswordValidation {
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
