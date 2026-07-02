import { beforeEach, describe, expect, it } from 'vitest'
import {
  checkRateLimit,
  clientIpFromHeaders,
  rateLimitKey,
  resetRateLimitForTests,
} from '@/shared/middleware/rate-limit'

function headers(values: Record<string, string>): Headers {
  return new Headers(values)
}

describe('rate limit helpers', () => {
  beforeEach(() => {
    resetRateLimitForTests()
  })

  it('extracts the first forwarded IP address', () => {
    expect(clientIpFromHeaders(headers({ 'x-forwarded-for': '203.0.113.10, 10.0.0.1' }))).toBe(
      '203.0.113.10'
    )
  })

  it('falls back through common proxy IP headers', () => {
    expect(clientIpFromHeaders(headers({ 'x-real-ip': '203.0.113.20' }))).toBe('203.0.113.20')
    expect(clientIpFromHeaders(headers({ 'cf-connecting-ip': '203.0.113.30' }))).toBe(
      '203.0.113.30'
    )
  })

  it('builds stable keys with normalized identifiers', () => {
    const key = rateLimitKey(
      'login',
      headers({ 'x-forwarded-for': '203.0.113.10' }),
      'User@INTI.EDU '
    )
    expect(key).toBe('login:203.0.113.10:user@inti.edu')
  })

  it('allows requests up to the configured limit', () => {
    const options = { limit: 2, windowMs: 60_000, now: 1000 }
    expect(checkRateLimit('k', options).limited).toBe(false)
    expect(checkRateLimit('k', { ...options, now: 2000 }).limited).toBe(false)
  })

  it('blocks requests after the configured limit until reset', () => {
    const options = { limit: 2, windowMs: 60_000, now: 1000 }
    checkRateLimit('k', options)
    checkRateLimit('k', { ...options, now: 2000 })

    const blocked = checkRateLimit('k', { ...options, now: 3000 })
    expect(blocked.limited).toBe(true)
    expect(blocked.retryAfterSeconds).toBe(58)
  })

  it('resets the bucket after the window expires', () => {
    const options = { limit: 1, windowMs: 1000, now: 1000 }
    expect(checkRateLimit('k', options).limited).toBe(false)
    expect(checkRateLimit('k', { ...options, now: 1500 }).limited).toBe(true)
    expect(checkRateLimit('k', { ...options, now: 2001 }).limited).toBe(false)
  })
})
