import 'server-only'

import { createHash } from 'node:crypto'
import { reportServerError } from '@/lib/error-reporting'
import { createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, type RateLimitOptions, type RateLimitResult } from './rate-limit'

function fallbackRateLimit(key: string, options: RateLimitOptions) {
  return checkRateLimit(key, options)
}

function keyFingerprint(key: string) {
  return createHash('sha256').update(key).digest('hex').slice(0, 16)
}

function persistentBackendConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
}

export async function checkPersistentRateLimit(
  key: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  if (!persistentBackendConfigured() || process.env.RATE_LIMIT_BACKEND === 'memory') {
    return fallbackRateLimit(key, options)
  }

  const now = options.now ?? Date.now()

  try {
    const supabase = await createServiceClient()
    const { data, error } = await supabase.rpc('hit_rate_limit', {
      p_key: key,
      p_limit: options.limit,
      p_window_ms: options.windowMs,
      p_now: new Date(now).toISOString(),
    })

    if (error) throw error

    const row = data?.[0]
    if (!row) throw new Error('Rate limit RPC returned no row')

    const resetAt = Date.parse(row.reset_at)

    return {
      limited: row.limited,
      remaining: row.remaining,
      resetAt: Number.isFinite(resetAt) ? resetAt : now + options.windowMs,
      retryAfterSeconds: row.retry_after_seconds,
    }
  } catch (error) {
    reportServerError('security.rate_limit.persistent_failed', error, {
      key_fingerprint: keyFingerprint(key),
      limit: options.limit,
      window_ms: options.windowMs,
    })
    return fallbackRateLimit(key, options)
  }
}
