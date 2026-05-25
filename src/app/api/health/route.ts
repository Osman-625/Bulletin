import { NextResponse } from 'next/server'
import { reportServerWarning } from '@/lib/error-reporting'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
  'X-Robots-Tag': 'noindex, nofollow',
}

const debugChannels = [
  'vercel_runtime_logs',
  'sentry_errors',
  'github_actions',
  'supabase_project_logs',
  'backup_artifacts',
] as const

type HealthCheck = {
  status: 'ok' | 'error'
  latencyMs: number
  message?: string
}

function version() {
  return process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? 'local'
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

export async function GET() {
  const database = await checkDatabase()
  const ok = database.status === 'ok'

  return NextResponse.json(
    {
      ok,
      status: ok ? 'ok' : 'degraded',
      service: 'bulletin',
      version: version(),
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'unknown',
      timestamp: new Date().toISOString(),
      checks: {
        database,
      },
      debug: {
        requestId: crypto.randomUUID(),
        channels: debugChannels,
        health: '/api/health',
        runbook: 'docs/operations/backup-rollback.md',
      },
    },
    {
      status: ok ? 200 : 503,
      headers: NO_STORE_HEADERS,
    }
  )
}
