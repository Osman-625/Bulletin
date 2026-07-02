import { NextResponse } from 'next/server'
import { cleanupOrphanBannerImages } from '@/infrastructure/storage/banner-cleanup'
import { reportServerError } from '@/shared/errors/error-reporting'
import { createServiceClient } from '@/infrastructure/database/server'

export const runtime = 'nodejs'

const DEFAULT_MAX_DELETES = 100

function configuredMaxDeletes() {
  const value = Number.parseInt(process.env.BANNER_CLEANUP_MAX_DELETES ?? '', 10)
  if (!Number.isFinite(value) || value < 1) return DEFAULT_MAX_DELETES
  return Math.min(value, 1000)
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (request.headers.get('Authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const dryRun = url.searchParams.get('dryRun') === '1'

  try {
    const supabase = await createServiceClient()
    const result = await cleanupOrphanBannerImages(supabase, {
      dryRun,
      maxDeletes: configuredMaxDeletes(),
    })

    if (result.errors.length > 0) {
      reportServerError(
        'maintenance.banner_cleanup.remove_failed',
        new Error('One or more banner cleanup batches failed.'),
        {
          errorCount: result.errors.length,
          errors: result.errors.join('; '),
          orphaned: result.orphaned,
          deleted: result.deleted,
          dryRun: result.dryRun,
        }
      )
    }

    return NextResponse.json(
      {
        ok: result.errors.length === 0,
        ...result,
      },
      { status: result.errors.length === 0 ? 200 : 500 }
    )
  } catch (error) {
    reportServerError('maintenance.banner_cleanup.failed', error)
    return NextResponse.json({ error: 'Banner cleanup failed' }, { status: 500 })
  }
}
