import 'server-only'

type ErrorMetadataValue = string | number | boolean | null | undefined
type ErrorMetadata = Record<string, ErrorMetadataValue>

function errorField(error: unknown, field: string): string | undefined {
  if (!error || typeof error !== 'object') return undefined
  const value = (error as Record<string, unknown>)[field]
  return typeof value === 'string' ? value : undefined
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
    metadata,
    occurred_at: new Date().toISOString(),
  }
}

export function reportServerError(context: string, error: unknown, metadata: ErrorMetadata = {}) {
  console.error('[server-error]', buildServerErrorLog(context, error, metadata))
}
