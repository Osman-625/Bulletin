import { describe, expect, it, vi } from 'vitest'
import { buildServerErrorLog, reportServerError } from '@/lib/error-reporting'

describe('server error reporting', () => {
  it('keeps a structured diagnostic log without making raw errors user-facing', () => {
    const log = buildServerErrorLog('admin.categories.create', {
      message: 'duplicate key value violates unique constraint "categories_slug_key"',
      code: '23505',
      details: 'Key (slug)=(academic) already exists.',
    })

    expect(log).toMatchObject({
      context: 'admin.categories.create',
      message: 'duplicate key value violates unique constraint "categories_slug_key"',
      code: '23505',
      details: 'Key (slug)=(academic) already exists.',
    })
    expect(log.occurred_at).toEqual(expect.any(String))
  })

  it('logs with a stable server-error marker and structured metadata', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    reportServerError('owner.categories.delete', new Error('delete failed'), {
      actorId: 'user-1',
      targetId: 'category-1',
    })

    expect(spy).toHaveBeenCalledWith(
      '[server-error]',
      expect.objectContaining({
        context: 'owner.categories.delete',
        message: 'delete failed',
        metadata: {
          actorId: 'user-1',
          targetId: 'category-1',
        },
      })
    )

    spy.mockRestore()
  })
})
