import { headers } from 'next/headers'
import { checkPersistentRateLimit } from '@/shared/middleware/persistent-rate-limit'
import { rateLimitKey } from '@/shared/middleware/rate-limit'

const AUTH_LIMIT = 5
const AUTH_WINDOW_MS = 60_000

export async function checkActionRateLimit(scope: string, identifier?: string | null) {
  if (
    process.env.NODE_ENV !== 'production' &&
    (process.env.NODE_ENV === 'development' || process.env.E2E_DISABLE_RATE_LIMIT === '1')
  ) {
    return {
      limited: false,
      remaining: AUTH_LIMIT,
      resetAt: Date.now() + AUTH_WINDOW_MS,
      retryAfterSeconds: 0,
    }
  }

  const headerStore = await headers()
  return checkPersistentRateLimit(rateLimitKey(scope, headerStore, identifier), {
    limit: AUTH_LIMIT,
    windowMs: AUTH_WINDOW_MS,
  })
}
