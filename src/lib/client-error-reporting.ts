import * as Sentry from '@sentry/nextjs'

type ClientErrorMetadataValue = string | number | boolean | null | undefined
type ClientErrorMetadata = Record<string, ClientErrorMetadataValue>

const SENSITIVE_METADATA_KEY = /(authorization|cookie|email|key|password|secret|token)/i
const REDACTED = '[redacted]'

function errorField(error: unknown, field: string): string | undefined {
  if (!error || typeof error !== 'object') return undefined
  const value = (error as Record<string, unknown>)[field]
  return typeof value === 'string' ? value : undefined
}

function errorForCapture(error: unknown, fallbackMessage: string) {
  return error instanceof Error ? error : new Error(fallbackMessage)
}

function sentryMetadata(metadata: ClientErrorMetadata) {
  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [
      key,
      SENSITIVE_METADATA_KEY.test(key) ? REDACTED : (value ?? null),
    ])
  )
}

export function buildClientErrorLog(
  context: string,
  error: unknown,
  metadata: ClientErrorMetadata = {}
) {
  return {
    context,
    message:
      error instanceof Error
        ? error.message
        : errorField(error, 'message') || (typeof error === 'string' ? error : 'Unknown error'),
    name: error instanceof Error ? error.name : errorField(error, 'name'),
    metadata,
    occurred_at: new Date().toISOString(),
  }
}

export function reportClientError(
  context: string,
  error: unknown,
  metadata: ClientErrorMetadata = {}
) {
  const log = buildClientErrorLog(context, error, metadata)

  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.captureException(errorForCapture(error, log.message), {
      tags: { context },
      extra: {
        metadata: sentryMetadata(metadata),
        occurred_at: log.occurred_at,
      },
    })
  }

  console.error('[client-error]', log)
}
