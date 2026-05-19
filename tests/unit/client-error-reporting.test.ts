import { describe, expect, it, vi } from 'vitest'
import { buildClientErrorLog, reportClientError } from '@/lib/client-error-reporting'

describe('client error reporting', () => {
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
})
