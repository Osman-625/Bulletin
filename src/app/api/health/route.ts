import { NextResponse, type NextRequest } from 'next/server'
import { reportServerWarning } from '@/shared/errors/error-reporting'
import { createAdminClient } from '@/infrastructure/database/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
  'X-Robots-Tag': 'noindex, nofollow',
}

type HealthCheck = {
  status: 'ok' | 'error'
  latencyMs: number
  message?: string
}

type PublicHealthCheck = Pick<HealthCheck, 'status' | 'latencyMs'>

function publicHealthCheck(check: HealthCheck): PublicHealthCheck {
  return {
    status: check.status,
    latencyMs: check.latencyMs,
  }
}

function diagnosticsEnabled(request: NextRequest) {
  const secret = process.env.HEALTH_DEBUG_SECRET?.trim()
  return Boolean(secret && request.headers.get('x-health-secret') === secret)
}

async function checkDatabase(): Promise<HealthCheck> {
  const startedAt = Date.now()

  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from('users').select('id', { count: 'exact', head: true })

    if (error) throw error

    return {
      status: 'ok',
      latencyMs: Date.now() - startedAt,
    }
  } catch (error) {
    reportServerWarning('health.database.unreachable', error, {
      route: '/api/health',
    })

    return {
      status: 'error',
      latencyMs: Date.now() - startedAt,
      message: 'Database reachability check failed.',
    }
  }
}

export async function GET(request: NextRequest) {
  const database = await checkDatabase()
  const ok = database.status === 'ok'
  const includeDiagnostics = diagnosticsEnabled(request)

  return NextResponse.json(
    {
      ok,
      status: ok ? 'ok' : 'degraded',
      service: 'bulletin',
      timestamp: new Date().toISOString(),
      checks: {
        database: includeDiagnostics ? database : publicHealthCheck(database),
      },
      ...(includeDiagnostics
        ? {
            diagnostics: {
              requestId: crypto.randomUUID(),
              route: '/api/health',
              version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? 'local',
              environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'unknown',
              runbook: 'docs/operations/backup-rollback.md',
            },
          }
        : null),
    },
    {
      status: ok ? 200 : 503,
      headers: NO_STORE_HEADERS,
    }
  )
}
