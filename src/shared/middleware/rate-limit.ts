export type RateLimitOptions = {
  limit: number
  windowMs: number
  now?: number
}

export type RateLimitResult = {
  limited: boolean
  remaining: number
  resetAt: number
  retryAfterSeconds: number
}

type Bucket = {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

export function clientIpFromHeaders(headers: Pick<Headers, 'get'>): string {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  if (forwarded) return forwarded

  const realIp = headers.get('x-real-ip')?.trim()
  if (realIp) return realIp

  const cloudflareIp = headers.get('cf-connecting-ip')?.trim()
  if (cloudflareIp) return cloudflareIp

  return 'unknown'
}

export function rateLimitKey(
  scope: string,
  headers: Pick<Headers, 'get'>,
  identifier?: string | null
): string {
  const normalizedIdentifier = identifier?.trim().toLowerCase()
  return [scope, clientIpFromHeaders(headers), normalizedIdentifier].filter(Boolean).join(':')
}

export function checkRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = options.now ?? Date.now()
  const current = buckets.get(key)

  if (!current || current.resetAt <= now) {
    const resetAt = now + options.windowMs
    buckets.set(key, { count: 1, resetAt })
    return {
      limited: false,
      remaining: Math.max(options.limit - 1, 0),
      resetAt,
      retryAfterSeconds: 0,
    }
  }

  if (current.count >= options.limit) {
    return {
      limited: true,
      remaining: 0,
      resetAt: current.resetAt,
      retryAfterSeconds: Math.max(Math.ceil((current.resetAt - now) / 1000), 1),
    }
  }

  current.count += 1
  buckets.set(key, current)

  return {
    limited: false,
    remaining: Math.max(options.limit - current.count, 0),
    resetAt: current.resetAt,
    retryAfterSeconds: 0,
  }
}

export function resetRateLimitForTests() {
  buckets.clear()
}
