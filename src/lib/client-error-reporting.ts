type ClientErrorMetadataValue = string | number | boolean | null | undefined
type ClientErrorMetadata = Record<string, ClientErrorMetadataValue>

function errorField(error: unknown, field: string): string | undefined {
  if (!error || typeof error !== 'object') return undefined
  const value = (error as Record<string, unknown>)[field]
  return typeof value === 'string' ? value : undefined
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
  console.error('[client-error]', buildClientErrorLog(context, error, metadata))
}
