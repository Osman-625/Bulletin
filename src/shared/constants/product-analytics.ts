'use client'

import posthog from 'posthog-js'

type ProductAnalyticsValue = string | number | boolean | null | undefined
type ProductAnalyticsProperties = Record<string, ProductAnalyticsValue>

const SENSITIVE_PROPERTY_KEY = /(authorization|body|cookie|email|key|password|secret|title|token)/i
const REDACTED = '[redacted]'

function productAnalyticsEnabled() {
  return Boolean(process.env.NEXT_PUBLIC_POSTHOG_TOKEN)
}

function sanitizeProductAnalyticsProperties(properties: ProductAnalyticsProperties = {}) {
  return Object.fromEntries(
    Object.entries(properties).map(([key, value]) => [
      key,
      SENSITIVE_PROPERTY_KEY.test(key) ? REDACTED : (value ?? null),
    ])
  )
}

export function captureProductEvent(event: string, properties: ProductAnalyticsProperties = {}) {
  if (!productAnalyticsEnabled()) return

  posthog.capture(event, sanitizeProductAnalyticsProperties(properties))
}
