import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

function source(path: string) {
  return readFileSync(path, 'utf8')
}

describe('tooling source guards', () => {
  it('declares dotenv directly because Playwright imports it', () => {
    const pkg = JSON.parse(source('package.json')) as {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }

    expect(pkg.dependencies?.dotenv ?? pkg.devDependencies?.dotenv).toBeDefined()
  })

  it('checks generated Supabase types against the committed type file', () => {
    const workflow = source('.github/workflows/test.yml')

    expect(workflow).toContain(
      'diff src/infrastructure/database/database.types.ts /tmp/database.types.generated.ts'
    )
    expect(workflow).toContain('> src/infrastructure/database/database.types.ts')
  })

  it('runs a production build in CI before browser smoke tests', () => {
    const workflow = source('.github/workflows/test.yml')
    const buildIndex = workflow.indexOf('npm run build')
    const e2eIndex = workflow.indexOf('npm run test:e2e')

    expect(buildIndex).toBeGreaterThan(-1)
    expect(e2eIndex).toBeGreaterThan(-1)
    expect(buildIndex).toBeLessThan(e2eIndex)
  })

  it('enforces formatting, dependency audit, and main-branch E2E gates in CI', () => {
    const workflow = source('.github/workflows/test.yml')

    expect(workflow).toContain('npm run format:check')
    expect(workflow).toContain('npm audit --audit-level=high')
    expect(workflow).toContain('npm audit --omit=dev --audit-level=high')
    expect(workflow).toContain('refs/heads/main')
    expect(workflow).toContain('E2E tests are required on main')
  })

  it('uses bracket notation for custom GitHub Actions secrets and variables', () => {
    for (const workflowPath of [
      '.github/workflows/test.yml',
      '.github/workflows/security-scan.yml',
      '.github/workflows/supabase-migrations.yml',
      '.github/workflows/database-backup.yml',
    ]) {
      const workflow = source(workflowPath)

      expect(workflow).not.toMatch(/\$\{\{\s*(?:secrets|vars)\.[A-Z0-9_]+/)
    }
  })

  it('defines a guarded Supabase migration workflow for staging and production', () => {
    const workflowPath = '.github/workflows/supabase-migrations.yml'

    expect(existsSync(workflowPath)).toBe(true)

    const workflow = source(workflowPath)

    expect(workflow).toContain('supabase/setup-cli@v2')
    expect(workflow).toContain("secrets['SUPABASE_ACCESS_TOKEN']")
    expect(workflow).toContain("secrets['STAGING_PROJECT_ID']")
    expect(workflow).toContain("secrets['STAGING_DB_PASSWORD']")
    expect(workflow).toContain("secrets['PRODUCTION_PROJECT_ID']")
    expect(workflow).toContain("secrets['PRODUCTION_DB_PASSWORD']")
    expect(workflow).not.toContain('secrets.SUPABASE_ACCESS_TOKEN')
    expect(workflow).not.toContain('secrets.STAGING_PROJECT_ID')
    expect(workflow).not.toContain('secrets.STAGING_DB_PASSWORD')
    expect(workflow).toContain('supabase link --project-ref "$PROJECT_ID"')
    expect(workflow).toContain('supabase db push --dry-run')
    expect(workflow).toContain('supabase db push')
    expect(workflow).toContain('environment: ${{ inputs.target }}')
    expect(workflow).toContain('if: ${{ inputs.apply }}')
  })

  it('defines a manual OWASP ZAP baseline scan with explicit rules and no issue writes', () => {
    const workflowPath = '.github/workflows/security-scan.yml'

    expect(existsSync(workflowPath)).toBe(true)
    expect(existsSync('.zap/rules.tsv')).toBe(true)

    const workflow = source(workflowPath)
    const rules = source('.zap/rules.tsv')

    expect(workflow).toContain('zaproxy/action-baseline@v0.15.0')
    expect(workflow).toContain('workflow_dispatch:')
    expect(workflow).toContain('target_url:')
    expect(workflow).toContain("vars['ZAP_TARGET_URL']")
    expect(workflow).toContain("vars['PRODUCTION_URL']")
    expect(workflow).not.toContain('vars.ZAP_TARGET_URL')
    expect(workflow).not.toContain('vars.PRODUCTION_URL')
    expect(workflow).toContain('target: ${{ steps.target.outputs.url }}')
    expect(workflow).toContain("docker_name: 'ghcr.io/zaproxy/zaproxy:stable'")
    expect(workflow).toContain("rules_file_name: '.zap/rules.tsv'")
    expect(workflow).toContain('allow_issue_writing: false')
    expect(workflow).toContain('fail_action: true')
    expect(workflow).toContain('artifact_name: zap-baseline')
    expect(rules).toContain('# ZAP baseline rules')
    expect(rules).not.toContain('\tIGNORE\t')
  })

  it('provides a deployment smoke test command that does not start a local server', () => {
    const pkg = JSON.parse(source('package.json')) as {
      scripts?: Record<string, string>
    }
    const configPath = 'config/playwright.smoke.config.ts'
    const specPath = 'tests/e2e/deploy-smoke.spec.ts'

    expect(pkg.scripts?.['test:smoke']).toBe(
      'playwright test --config config/playwright.smoke.config.ts'
    )
    expect(existsSync(configPath)).toBe(true)
    expect(existsSync(specPath)).toBe(true)

    const config = source(configPath)
    const spec = source(specPath)

    expect(config).toContain("testMatch: 'deploy-smoke.spec.ts'")
    expect(config).toContain('PLAYWRIGHT_BASE_URL')
    expect(config).toContain('ALLOW_LOCAL_SMOKE')
    expect(config).toContain('PLAYWRIGHT_BASE_URL is required')
    expect(config).not.toContain("?? 'http://localhost:3000'")
    expect(config).not.toContain('webServer')
    expect(spec).toContain("test.describe('deployment smoke'")
    expect(spec).toContain('PLAYWRIGHT_BASE_URL is required')
    expect(spec).not.toContain("?? 'http://localhost:3000'")
    expect(spec).toContain("page.goto('/', { waitUntil: 'domcontentloaded' })")
    expect(spec).toContain("page.goto('/login', { waitUntil: 'domcontentloaded' })")
    expect(spec).toContain('request.post(`${BASE}/api/setup`)')
    expect(spec).toContain('page.setViewportSize({ width: 390, height: 844 })')
  })

  it('keeps deployment smoke assertions out of the dev-server E2E config', () => {
    const config = source('config/playwright.config.ts')

    expect(config).toContain("testIgnore: 'deploy-smoke.spec.ts'")
    expect(config).not.toContain("testMatch: 'deploy-smoke.spec.ts'")
  })

  it('keeps shadcn out of production dependencies', () => {
    const pkg = JSON.parse(source('package.json')) as {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }

    expect(pkg.dependencies?.shadcn).toBeUndefined()
    expect(pkg.devDependencies?.shadcn).toBeDefined()
  })

  it('wires Vercel Web Analytics in the root layout', () => {
    const pkg = JSON.parse(source('package.json')) as {
      dependencies?: Record<string, string>
    }
    const layout = source('src/app/layout.tsx')

    expect(pkg.dependencies?.['@vercel/analytics']).toBeDefined()
    expect(layout).toContain("import { Analytics } from '@vercel/analytics/next'")
    expect(layout).toContain('<Analytics />')
    expect(layout).toContain('<SpeedInsights />')
  })

  it('wires Sentry error monitoring without hardcoded DSNs', () => {
    const pkg = JSON.parse(source('package.json')) as {
      dependencies?: Record<string, string>
    }
    const nextConfig = source('next.config.ts')
    const proxy = source('src/proxy.ts')
    const envExample = source('.env.example')
    const instrumentation = source('src/instrumentation.ts')
    const clientInstrumentation = source('src/instrumentation-client.ts')
    const serverConfig = source('src/sentry.server.config.ts')
    const edgeConfig = source('src/sentry.edge.config.ts')
    const globalError = source('src/app/global-error.tsx')
    const serverReporter = source('src/shared/errors/error-reporting.ts')
    const clientReporter = source('src/shared/errors/client-error-reporting.ts')

    expect(pkg.dependencies?.['@sentry/nextjs']).toBeDefined()
    expect(nextConfig).toContain("import { withSentryConfig } from '@sentry/nextjs'")
    expect(nextConfig).toContain('withSentryConfig(nextConfig')
    expect(nextConfig).toContain('process.env.SENTRY_AUTH_TOKEN')
    expect(proxy).toContain('https://*.sentry.io')

    expect(instrumentation).toContain('export async function register()')
    expect(instrumentation).toContain("process.env.NEXT_RUNTIME === 'nodejs'")
    expect(instrumentation).toContain("process.env.NEXT_RUNTIME === 'edge'")
    expect(instrumentation).toContain('Sentry.captureRequestError')

    expect(clientInstrumentation).toContain('NEXT_PUBLIC_SENTRY_DSN')
    expect(clientInstrumentation).toContain('Sentry.init(')
    expect(clientInstrumentation).toContain('Sentry.captureRouterTransitionStart')
    expect(serverConfig).toContain('Sentry.init(')
    expect(serverConfig).toContain('sendDefaultPii: false')
    expect(edgeConfig).toContain('Sentry.init(')
    expect(edgeConfig).toContain('sendDefaultPii: false')
    expect(globalError).toContain('Sentry.captureException(error)')

    expect(serverReporter).toContain('Sentry.captureException(')
    expect(clientReporter).toContain('Sentry.captureException(')
    expect(envExample).toContain('NEXT_PUBLIC_SENTRY_DSN=')
    expect(envExample).toContain('SENTRY_AUTH_TOKEN=')
    expect(envExample).toContain('SENTRY_ORG=')
    expect(envExample).toContain('SENTRY_PROJECT=')
    expect(envExample).not.toContain('ingest.sentry.io/')
  })

  it('wires PostHog product analytics with explicit privacy-conscious events', () => {
    const pkg = JSON.parse(source('package.json')) as {
      dependencies?: Record<string, string>
    }
    const proxy = source('src/proxy.ts')
    const envExample = source('.env.example')
    const clientInstrumentation = source('src/instrumentation-client.ts')
    const analytics = source('src/shared/constants/product-analytics.ts')
    const feed = source('src/app/(public)/page.tsx')
    const feedAnalytics = source('src/components/analytics/PublicFeedAnalytics.tsx')
    const categoryFilter = source('src/components/announcements/CategoryFilter.tsx')
    const viewTracker = source('src/app/(public)/announcements/[id]/ViewTracker.tsx')
    const detailPage = source('src/app/(public)/announcements/[id]/page.tsx')
    const registrationLink = source('src/components/announcements/RegistrationLink.tsx')
    const form = [
      'src/components/dashboard/AnnouncementForm.tsx',
      'src/components/dashboard/BannerImageField.tsx',
    ]
      .map(source)
      .join('\n')

    expect(pkg.dependencies?.['posthog-js']).toBeDefined()
    expect(clientInstrumentation).toContain("import posthog from 'posthog-js'")
    expect(clientInstrumentation).toContain('NEXT_PUBLIC_POSTHOG_TOKEN')
    expect(clientInstrumentation).toContain('NEXT_PUBLIC_POSTHOG_HOST')
    expect(clientInstrumentation).toContain("defaults: '2026-01-30'")
    expect(clientInstrumentation).toContain('autocapture: false')
    expect(clientInstrumentation).toContain('disable_session_recording')
    expect(proxy).toContain('https://*.posthog.com')
    expect(proxy).toContain('https://*.i.posthog.com')
    expect(envExample).toContain('NEXT_PUBLIC_POSTHOG_TOKEN=')
    expect(envExample).toContain('NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com')
    expect(envExample).toContain('NEXT_PUBLIC_POSTHOG_SESSION_REPLAY=0')

    expect(analytics).toContain('captureProductEvent')
    expect(analytics).toContain('SENSITIVE_PROPERTY_KEY')
    expect(analytics).toContain('[redacted]')
    expect(feed).toContain('<PublicFeedAnalytics')
    expect(feedAnalytics).toContain("captureProductEvent('public_feed_viewed'")
    expect(feedAnalytics).toContain("captureProductEvent('public_feed_searched'")
    expect(feedAnalytics).toContain('searchLength')
    expect(feedAnalytics).not.toContain('search,')
    expect(categoryFilter).toContain("captureProductEvent('public_feed_category_selected'")
    expect(viewTracker).toContain("captureProductEvent('announcement_detail_viewed'")
    expect(detailPage).toContain('<RegistrationLink')
    expect(registrationLink).toContain("captureProductEvent('announcement_registration_clicked'")
    expect(form).toContain("captureProductEvent('publisher_announcement_saved'")
    expect(form).toContain("captureProductEvent('publisher_announcement_submitted'")
    expect(form).toContain("captureProductEvent('publisher_banner_uploaded'")
    expect(form).toContain("captureProductEvent('publisher_announcement_deleted'")
  })

  it('provides owner credentials to CI because owner E2E specs require them', () => {
    const workflow = source('.github/workflows/test.yml')

    expect(workflow).toContain("TEST_OWNER_EMAIL: ${{ secrets['TEST_OWNER_EMAIL'] }}")
    expect(workflow).toContain("TEST_OWNER_PASSWORD: ${{ secrets['TEST_OWNER_PASSWORD'] }}")
  })

  it('keeps Next generated type roots in the TypeScript project', () => {
    const tsconfig = source('tsconfig.json')

    expect(tsconfig).toContain('.next/types/**/*.ts')
    expect(tsconfig).toContain('.next/dev/types/**/*.ts')
  })

  it('documents local test env flags without concrete project identifiers', () => {
    const envExample = source('.env.example')

    expect(envExample).toContain('E2E_DISABLE_RATE_LIMIT=1')
    expect(envExample).toContain('VERCEL_PROJECT_ID=')
    expect(envExample).not.toContain('prj_u9sULnmr3iy7T7NvxROkbQVll3Km')
    expect(envExample).not.toContain('osman_owner@bulletin.internal')
  })

  it('provides a daily database backup workflow and rollback/debug runbook', () => {
    const workflowPath = '.github/workflows/database-backup.yml'
    const runbookPath = 'docs/operations/backup-rollback.md'

    expect(existsSync(workflowPath)).toBe(true)
    expect(existsSync(runbookPath)).toBe(true)

    const workflow = source(workflowPath)
    const runbook = source(runbookPath)

    expect(workflow).toContain('workflow_dispatch:')
    expect(workflow).toContain('schedule:')
    expect(workflow).toContain("cron: '23 19 * * *'")
    expect(workflow).toContain("secrets['SUPABASE_DB_URL']")
    expect(workflow).not.toContain('secrets.SUPABASE_DB_URL')
    expect(workflow).toContain('pg_dump')
    expect(workflow).toContain('actions/upload-artifact@v4')
    expect(workflow).toContain('retention-days: 7')
    expect(runbook).toContain('Daily backup')
    expect(runbook).toContain('Rollback drill')
    expect(runbook).toContain('Debug channels')
    expect(runbook).toContain('/api/health')
    expect(runbook).toContain('SUPABASE_DB_URL')
  })
})
