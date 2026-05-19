import { afterEach, describe, expect, it } from 'vitest'
import { credentialsForRole } from '../e2e/helpers/auth'
import { hasEnv } from '../e2e/helpers/env'

const managedKeys = [
  'TEST_OWNER_EMAIL',
  'TEST_OWNER_PASSWORD',
  'TEST_SUPER_ADMIN_EMAIL',
  'TEST_SUPER_ADMIN_PASSWORD',
  'TEST_ADMIN_EMAIL',
  'TEST_ADMIN_PASSWORD',
  'TEST_PUBLISHER_EMAIL',
  'TEST_PUBLISHER_PASSWORD',
]

const originalEnv = Object.fromEntries(managedKeys.map((key) => [key, process.env[key]]))

afterEach(() => {
  for (const key of managedKeys) {
    const originalValue = originalEnv[key]

    if (originalValue === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = originalValue
    }
  }
})

describe('E2E auth helper', () => {
  it('only requires credentials for the selected role', () => {
    for (const key of managedKeys) {
      delete process.env[key]
    }

    process.env.TEST_PUBLISHER_EMAIL = 'publisher@example.test'
    process.env.TEST_PUBLISHER_PASSWORD = 'secret-password'

    expect(credentialsForRole('publisher')).toEqual({
      email: 'publisher@example.test',
      password: 'secret-password',
    })
  })

  it('can check optional role credentials without throwing', () => {
    delete process.env.TEST_OWNER_EMAIL
    process.env.TEST_OWNER_PASSWORD = 'owner-password'

    expect(hasEnv('TEST_OWNER_EMAIL', 'TEST_OWNER_PASSWORD')).toBe(false)

    process.env.TEST_OWNER_EMAIL = 'owner@example.test'

    expect(hasEnv('TEST_OWNER_EMAIL', 'TEST_OWNER_PASSWORD')).toBe(true)
  })
})
