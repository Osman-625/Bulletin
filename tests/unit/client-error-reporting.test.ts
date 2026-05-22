import * as Sentry from '@sentry/nextjs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildClientErrorLog, reportClientError } from '@/lib/client-error-reporting'

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}))

describe('client error reporting', () => {
  afterEach(() => {
    vi.mocked(Sentry.captureException).mockReset()
    vi.unstubAllEnvs()
  })

  it('builds a structured browser-safe error payload', () => {
    const log = buildClientErrorLog('announcement_form.banner_upload', new Error('Upload failed'), {
      fileType: 'image/png',
    })

    expect(log).toMatchObject({
      context: 'announcement_form.banner_upload',
      message: 'Upload failed',
      name: 'Error',
      metadata: {
        fileType: 'image/png',
      },
    })
    expect(log.occurred_at).toEqual(expect.any(String))
  })

  it('logs with a stable client-error marker', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    reportClientError('announcement_form.save', 'Could not save')

    expect(spy).toHaveBeenCalledWith(
      '[client-error]',
      expect.objectContaining({
        context: 'announcement_form.save',
        message: 'Could not save',
      })
    )

    spy.mockRestore()
  })

  it('forwards redacted metadata to Sentry only when configured', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', 'https://examplePublicKey@o0.ingest.sentry.io/0')

    reportClientError('announcement_form.banner_upload', new Error('Upload failed'), {
      email: 'person@example.edu',
      fileType: 'image/png',
    })

    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        tags: { context: 'announcement_form.banner_upload' },
        extra: expect.objectContaining({
          metadata: {
            email: '[redacted]',
            fileType: 'image/png',
          },
        }),
      })
    )

    spy.mockRestore()
  })
})
