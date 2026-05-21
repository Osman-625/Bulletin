import type { SupabaseClient } from '@supabase/supabase-js'
import { unstable_rethrow } from 'next/navigation'
import { reportServerError } from '@/lib/error-reporting'

type ResourceMetric = {
  label: string
  value: string
  tone?: 'neutral' | 'good' | 'warn' | 'bad'
}

export type ExternalResourceCard = {
  name: string
  status: 'ready' | 'attention' | 'not_configured' | 'error'
  summary: string
  href?: string
  metrics: ResourceMetric[]
}

export type AnnouncementViewRow = {
  id: string
  title: string
  status: string
  view_count: number | null
  published_at: string | null
  registration_link: string | null
  categories: { name: string; color: string | null } | null
  organizations: { name: string } | null
}

export type OwnerResourceOverview = {
  totalViews: number
  publishedViews: number
  averageViews: number
  postsWithRegistration: number
  pendingPasswordResets: number
  setupRouteEnabled: boolean
  bannerFiles: number
  bannerStorageBytes: number
  bannerStorageStatus: 'ready' | 'missing' | 'error'
  topAnnouncements: AnnouncementViewRow[]
  viewsByCategory: Array<{ name: string; color: string; views: number }>
  viewsByOrganization: Array<{ name: string; views: number }>
  external: {
    vercel: ExternalResourceCard
    supabase: ExternalResourceCard
  }
}

type StorageFile = {
  name: string
  metadata?: {
    size?: number
  } | null
}

type VercelDeployment = {
  uid?: string
  name?: string
  url?: string
  state?: string
  target?: string
  created?: number
  createdAt?: number
  meta?: Record<string, string | undefined>
}

type SupabaseHealthService = {
  name?: string
  healthy?: boolean
  status?: string
  error?: string | null
}

export async function getOwnerResourceOverview(
  supabase: SupabaseClient
): Promise<OwnerResourceOverview> {
  const [announcementResult, passwordResetResult, bannerStorage, vercel, supabaseExternal] =
    await Promise.all([
      supabase
        .from('announcements')
        .select(
          'id, title, status, view_count, published_at, registration_link, categories(name, color), organizations(name)'
        )
        .order('view_count', { ascending: false })
        .limit(1000),
      supabase
        .from('password_reset_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
      getBannerStorageSummary(supabase),
      getVercelResourceCard(),
      getSupabaseResourceCard(),
    ])

  if (announcementResult.error) {
    reportServerError('owner.resources.announcements_query_failed', announcementResult.error)
  }

  if (passwordResetResult.error) {
    reportServerError('owner.resources.password_resets_count_failed', passwordResetResult.error)
  }

  const viewRows = announcementResult.data
  const pendingPasswordResets = passwordResetResult.count

  const announcements = ((viewRows ?? []) as unknown as AnnouncementViewRow[]).map((row) => ({
    ...row,
    view_count: row.view_count ?? 0,
  }))

  const totalViews = announcements.reduce((sum, row) => sum + (row.view_count ?? 0), 0)
  const publishedRows = announcements.filter((row) => row.status === 'published')
  const publishedViews = publishedRows.reduce((sum, row) => sum + (row.view_count ?? 0), 0)
  const averageViews =
    publishedRows.length > 0 ? Math.round(publishedViews / publishedRows.length) : 0
  const postsWithRegistration = announcements.filter((row) => row.registration_link).length

  return {
    totalViews,
    publishedViews,
    averageViews,
    postsWithRegistration,
    pendingPasswordResets: pendingPasswordResets ?? 0,
    setupRouteEnabled: process.env.ENABLE_SETUP_ROUTE === '1',
    bannerFiles: bannerStorage.files,
    bannerStorageBytes: bannerStorage.bytes,
    bannerStorageStatus: bannerStorage.status,
    topAnnouncements: announcements.filter((row) => (row.view_count ?? 0) > 0).slice(0, 10),
    viewsByCategory: summarizeViewsByCategory(announcements),
    viewsByOrganization: summarizeViewsByOrganization(announcements),
    external: {
      vercel,
      supabase: supabaseExternal,
    },
  }
}

async function getBannerStorageSummary(supabase: SupabaseClient) {
  const { data, error } = await supabase.storage.from('banner-images').list('', {
    limit: 1000,
    sortBy: { column: 'created_at', order: 'desc' },
  })

  if (error) {
    reportServerError('owner.resources.banner_storage_list_failed', error, {
      bucket: 'banner-images',
    })
    return {
      files: 0,
      bytes: 0,
      status: error.message.toLowerCase().includes('not found') ? 'missing' : 'error',
    } as const
  }

  const files = ((data ?? []) as StorageFile[]).filter(
    (file) => file.name !== '.emptyFolderPlaceholder'
  )
  return {
    files: files.length,
    bytes: files.reduce((sum, file) => sum + (file.metadata?.size ?? 0), 0),
    status: 'ready',
  } as const
}

async function getVercelResourceCard(): Promise<ExternalResourceCard> {
  const token = process.env.VERCEL_API_TOKEN
  const projectId = process.env.VERCEL_PROJECT_ID
  const teamId = process.env.VERCEL_TEAM_ID

  if (!token || !projectId) {
    return {
      name: 'Vercel',
      status: 'not_configured',
      summary: 'Add VERCEL_API_TOKEN and VERCEL_PROJECT_ID to show deployment status.',
      href: 'https://vercel.com/dashboard',
      metrics: [
        {
          label: 'API token',
          value: token ? 'Configured' : 'Missing',
          tone: token ? 'good' : 'warn',
        },
        {
          label: 'Project ID',
          value: projectId ? 'Configured' : 'Missing',
          tone: projectId ? 'good' : 'warn',
        },
        { label: 'Team ID', value: teamId ? 'Configured' : 'Optional' },
      ],
    }
  }

  const url = new URL('https://api.vercel.com/v6/deployments')
  url.searchParams.set('projectId', projectId)
  url.searchParams.set('target', 'production')
  url.searchParams.set('limit', '1')
  if (teamId) url.searchParams.set('teamId', teamId)

  const response = await fetchJson<{ deployments?: VercelDeployment[] }>(url, token)

  if (!response.ok) {
    return {
      name: 'Vercel',
      status: 'error',
      summary: response.message,
      href: 'https://vercel.com/dashboard',
      metrics: [
        { label: 'API token', value: 'Configured', tone: 'good' },
        { label: 'Project ID', value: 'Configured', tone: 'good' },
      ],
    }
  }

  const deployment = response.data.deployments?.[0]
  if (!deployment) {
    return {
      name: 'Vercel',
      status: 'attention',
      summary: 'No production deployments were returned for this project.',
      href: 'https://vercel.com/dashboard',
      metrics: [{ label: 'Latest production', value: 'None found', tone: 'warn' }],
    }
  }

  const created = deployment.created ?? deployment.createdAt
  const state = deployment.state ?? 'UNKNOWN'

  return {
    name: 'Vercel',
    status: state === 'READY' ? 'ready' : 'attention',
    summary: `Latest production deployment is ${state.toLowerCase()}.`,
    href: deployment.url ? `https://${deployment.url}` : 'https://vercel.com/dashboard',
    metrics: [
      { label: 'State', value: state, tone: state === 'READY' ? 'good' : 'warn' },
      { label: 'Target', value: deployment.target ?? 'production' },
      { label: 'Created', value: created ? formatDateTime(created) : 'Unknown' },
      { label: 'Commit', value: deployment.meta?.githubCommitSha?.slice(0, 7) ?? 'Unavailable' },
    ],
  }
}

async function getSupabaseResourceCard(): Promise<ExternalResourceCard> {
  const token = process.env.SUPABASE_ACCESS_TOKEN
  const projectRef = process.env.SUPABASE_PROJECT_REF ?? inferSupabaseProjectRef()

  if (!token || !projectRef) {
    return {
      name: 'Supabase',
      status: 'not_configured',
      summary: 'Add SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF to show project health.',
      href: projectRef
        ? `https://supabase.com/dashboard/project/${projectRef}`
        : 'https://supabase.com/dashboard',
      metrics: [
        {
          label: 'Access token',
          value: token ? 'Configured' : 'Missing',
          tone: token ? 'good' : 'warn',
        },
        {
          label: 'Project ref',
          value: projectRef ? 'Configured' : 'Missing',
          tone: projectRef ? 'good' : 'warn',
        },
      ],
    }
  }

  const healthUrl = new URL(`https://api.supabase.com/v1/projects/${projectRef}/health`)
  for (const service of ['auth', 'postgres', 'storage']) {
    healthUrl.searchParams.append('services', service)
  }
  healthUrl.searchParams.set('timeout_ms', '3000')

  const usageUrl = new URL(
    `https://api.supabase.com/v1/projects/${projectRef}/analytics/endpoints/usage.api-requests-count`
  )

  const [health, usage] = await Promise.all([
    fetchJson<SupabaseHealthService[]>(healthUrl, token),
    fetchJson<{ result?: Array<{ count?: number }> }>(usageUrl, token),
  ])

  if (!health.ok) {
    return {
      name: 'Supabase',
      status: 'error',
      summary: health.message,
      href: `https://supabase.com/dashboard/project/${projectRef}`,
      metrics: [
        { label: 'Access token', value: 'Configured', tone: 'good' },
        { label: 'Project ref', value: 'Configured', tone: 'good' },
      ],
    }
  }

  const unhealthy = health.data.filter((service) => service.healthy === false)
  const requestCount = usage.ok ? usage.data.result?.[0]?.count : undefined

  return {
    name: 'Supabase',
    status: unhealthy.length === 0 ? 'ready' : 'attention',
    summary:
      unhealthy.length === 0
        ? 'Core project services are reporting healthy.'
        : `${unhealthy.length} service${unhealthy.length === 1 ? '' : 's'} need attention.`,
    href: `https://supabase.com/dashboard/project/${projectRef}`,
    metrics: [
      ...health.data.map((service) => ({
        label: service.name ?? 'service',
        value: service.healthy ? 'Healthy' : (service.status ?? 'Attention'),
        tone: service.healthy ? ('good' as const) : ('warn' as const),
      })),
      {
        label: 'API requests',
        value: requestCount != null ? requestCount.toLocaleString('en-MY') : 'Permission needed',
        tone: usage.ok ? ('neutral' as const) : ('warn' as const),
      },
    ],
  }
}

async function fetchJson<T>(url: URL, token: string) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 4500)
  const headers = new Headers()
  headers.set('Authorization', `Bearer ${token}`)

  try {
    const response = await fetch(url, {
      headers,
      cache: 'no-store',
      signal: controller.signal,
    })

    if (!response.ok) {
      reportServerError(
        'owner.resources.external_api_failed',
        new Error(`External API returned ${response.status}`),
        {
          hostname: url.hostname,
          pathname: url.pathname,
          status: response.status,
        }
      )
      return {
        ok: false as const,
        message: `API returned ${response.status}. Check token permissions and project identifiers.`,
      }
    }

    return { ok: true as const, data: (await response.json()) as T }
  } catch (error) {
    unstable_rethrow(error)
    reportServerError('owner.resources.external_api_unhandled', error, {
      hostname: url.hostname,
      pathname: url.pathname,
    })
    return {
      ok: false as const,
      message:
        error instanceof Error && error.name === 'AbortError'
          ? 'API request timed out.'
          : 'API request failed.',
    }
  } finally {
    clearTimeout(timeout)
  }
}

function summarizeViewsByCategory(rows: AnnouncementViewRow[]) {
  const counts = rows.reduce<Record<string, { color: string; views: number }>>((acc, row) => {
    const name = row.categories?.name ?? 'Uncategorized'
    if (!acc[name]) acc[name] = { color: row.categories?.color ?? '#C8102E', views: 0 }
    acc[name].views += row.view_count ?? 0
    return acc
  }, {})

  return Object.entries(counts)
    .map(([name, value]) => ({ name, ...value }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 8)
}

function summarizeViewsByOrganization(rows: AnnouncementViewRow[]) {
  const counts = rows.reduce<Record<string, number>>((acc, row) => {
    const name = row.organizations?.name ?? 'Unknown organization'
    acc[name] = (acc[name] ?? 0) + (row.view_count ?? 0)
    return acc
  }, {})

  return Object.entries(counts)
    .map(([name, views]) => ({ name, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 8)
}

function inferSupabaseProjectRef() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) return null

  try {
    return new URL(supabaseUrl).hostname.split('.')[0] || null
  } catch {
    return null
  }
}

function formatDateTime(value: number | string) {
  return new Date(value).toLocaleString('en-MY', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}
