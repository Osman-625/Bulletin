import 'server-only'

import * as Sentry from '@sentry/nextjs'

type ErrorMetadataValue = string | number | boolean | null | undefined
type ErrorMetadata = Record<string, ErrorMetadataValue>

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

function redactMetadata(metadata: ErrorMetadata) {
  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [
      key,
      SENSITIVE_METADATA_KEY.test(key) ? REDACTED : (value ?? null),
    ])
  )
}

export function buildServerErrorLog(context: string, error: unknown, metadata: ErrorMetadata = {}) {
  return {
    context,
    message:
      error instanceof Error
        ? error.message
        : errorField(error, 'message') || (typeof error === 'string' ? error : 'Unknown error'),
    name: error instanceof Error ? error.name : errorField(error, 'name'),
    code: errorField(error, 'code'),
    details: errorField(error, 'details'),
    hint: errorField(error, 'hint'),
    metadata: redactMetadata(metadata),
    occurred_at: new Date().toISOString(),
  }
}

export function reportServerError(context: string, error: unknown, metadata: ErrorMetadata = {}) {
  const log = buildServerErrorLog(context, error, metadata)

  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.captureException(errorForCapture(error, log.message), {
      tags: { context },
      extra: {
        code: log.code,
        details: log.details,
        hint: log.hint,
        metadata: log.metadata,
        occurred_at: log.occurred_at,
      },
    })
  }

  console.error('[server-error]', log)
}

export function reportServerWarning(context: string, error: unknown, metadata: ErrorMetadata = {}) {
  const log = buildServerErrorLog(context, error, metadata)

  console.warn('[server-warning]', log)
}
