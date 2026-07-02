import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

function source(path: string) {
  return readFileSync(path, 'utf8')
}

describe('React Doctor configuration', () => {
  it('recognizes the project auth helper used by server actions', () => {
    const configPath = 'doctor.config.json'

    expect(existsSync(configPath)).toBe(true)

    const config = JSON.parse(readFileSync(configPath, 'utf8')) as {
      ignore?: {
        overrides?: Array<{
          files?: string[]
          rules?: string[]
        }>
      }
      serverAuthFunctionNames?: string[]
    }

    expect(config.serverAuthFunctionNames).toContain('getCurrentAccessContext')
    expect(config.serverAuthFunctionNames).toContain('verifyAnnouncementAccess')
    expect(config.ignore?.overrides).toEqual(
      expect.arrayContaining([
        {
          files: ['src/app/**/announcements/**/actions.ts'],
          rules: ['react-doctor/server-auth-actions'],
        },
        {
          files: ['src/app/**/forgot-password/actions.ts'],
          rules: ['react-doctor/server-auth-actions'],
        },
        {
          files: ['src/app/register/actions.ts'],
          rules: ['react-doctor/server-auth-actions'],
        },
        {
          files: ['src/app/(dashboard)/dashboard/announcements/[id]/edit/actions.ts'],
          rules: ['react-doctor/server-sequential-independent-await'],
        },
        {
          files: ['src/app/opengraph-image.tsx'],
          rules: ['react-doctor/only-export-components'],
        },
      ])
    )
  })

  it('keeps React Doctor suppressions out of ESLint comments', () => {
    const publicActions = source('src/app/(public)/announcements/[id]/actions.ts')
    const forgotPasswordActions = source('src/app/(auth)/forgot-password/actions.ts')
    const registerActions = source('src/app/register/actions.ts')

    expect(publicActions).not.toContain('eslint-disable-next-line react-doctor/')
    expect(forgotPasswordActions).not.toContain('eslint-disable-next-line react-doctor/')
    expect(registerActions).not.toContain('eslint-disable-next-line react-doctor/')
  })

  it('avoids module-scope mutable containers in server action modules', () => {
    const accountActions = source('src/modules/users/actions.ts')
    const notificationActions = source('src/modules/notifications/actions.ts')

    expect(accountActions).not.toContain('new Set(')
    expect(accountActions).not.toContain('SETTINGS_PATHS')
    expect(notificationActions).not.toContain('NOTIFICATION_PATHS')
  })

  it('keeps announcement sorting immutable without spread-sort copies', () => {
    const feed = source('src/modules/announcements/feed.ts')
    const presentation = source('src/modules/announcements/presentation.ts')
    const publicBoard = source('src/modules/announcements/public-board.ts')

    expect(feed).not.toContain('[...topics.values()].sort(')
    expect(feed).toContain('Array.from(topics.values()).toSorted(')
    expect(presentation).not.toContain('[...announcements].sort(')
    expect(presentation).toContain('announcements.toSorted(')
    expect(publicBoard).not.toContain('[...announcements].sort(')
    expect(publicBoard).toContain('announcements.toSorted(')
  })

  it('keeps repeated date setup outside hot paths and lazy form state initialization', () => {
    const publicBoard = source('src/modules/announcements/public-board.ts')
    const announcementForm = source('src/components/dashboard/AnnouncementForm.tsx')

    expect(publicBoard).toContain('const CAMPUS_DAY_FORMATTER = new Intl.DateTimeFormat')
    expect(publicBoard).toContain('CAMPUS_DAY_FORMATTER.formatToParts')
    expect(announcementForm).toContain(
      'useReducer(\n    announcementFormReducer,\n    initialData,\n    createAnnouncementFormState\n  )'
    )
    expect(announcementForm).toContain('expiresAt: toDateInputValue(initialData.expires_at)')
    expect(announcementForm).toContain(
      'scheduledPublishAt: toDateTimeLocalInputValue(initialData.scheduled_publish_at)'
    )
    expect(announcementForm).toContain(
      'pinnedUntil: toDateTimeLocalInputValue(initialData.pinned_until)'
    )
  })

  it('uses single-pass array transforms for React Doctor performance warnings', () => {
    const forgotPasswordActions = source('src/app/(auth)/forgot-password/actions.ts')
    const reviewQueuePage = source('src/app/(admin)/admin/review/page.tsx')
    const ownerAuditPage = source('src/app/(owner)/owner/audit/page.tsx')
    const invitationValidation = source('src/modules/invitations/validation.ts')

    expect(forgotPasswordActions).toContain('(resetManagers ?? []).flatMap')
    expect(forgotPasswordActions).not.toContain(
      '.map((manager) => manager.id).filter((id) => id !== profile.id)'
    )
    expect(reviewQueuePage).toContain('queue.flatMap')
    expect(reviewQueuePage).not.toContain(
      'queue.map((announcement) => announcement.organizations?.name).filter(Boolean)'
    )
    expect(ownerAuditPage).toContain('value.flatMap')
    expect(ownerAuditPage).not.toContain('.map((item) => stringifyMeta(item))')
    expect(invitationValidation).toContain(".getAll('org_ids')")
    expect(invitationValidation).toContain('.flatMap((orgId)')
    expect(invitationValidation).not.toContain('.filter((orgId): orgId is string')
  })

  it('runs independent async work in parallel for React Doctor async warnings', () => {
    const reviewDetailPage = source('src/app/(admin)/admin/review/[id]/page.tsx')
    const ownerAuditPage = source('src/app/(owner)/owner/audit/page.tsx')
    const bannerCleanup = source('src/infrastructure/storage/banner-cleanup.ts')

    expect(reviewDetailPage).toContain('const announcementPromise = params.then')
    expect(reviewDetailPage).toContain('announcementPromise')
    expect(ownerAuditPage).toContain("supabase.rpc('search_audit_log'")
    expect(ownerAuditPage).toMatch(/Promise\.all\(\[[\s\S]*supabase\.rpc\('search_audit_log'/)
    expect(bannerCleanup).toContain('const nestedPathGroups = await Promise.all')
    expect(bannerCleanup).not.toContain('paths.push(...(await listBannerPaths')
    expect(bannerCleanup).toContain('const deleteResults = await Promise.all')
    expect(bannerCleanup).not.toContain('const { error } = await bucket.remove(batch)')
  })

  it('hoists static render data and pure helpers out of component bodies', () => {
    const newAnnouncementPage = source('src/app/(dashboard)/dashboard/announcements/new/page.tsx')
    const ownerPage = source('src/app/(owner)/owner/page.tsx')
    const superAdminPage = source('src/app/(super-admin)/super-admin/page.tsx')
    const brandLabView = source('src/app/brand-lab/BrandLabView.tsx')
    const announcementCard = source('src/components/announcements/AnnouncementCard.tsx')
    const announcementsClient = source('src/components/dashboard/AnnouncementsClient.tsx')
    const backNavButton = source('src/components/navigation/BackNavButton.tsx')

    expect(newAnnouncementPage).toContain('const NEW_ANNOUNCEMENT_INITIAL_DATA')
    expect(newAnnouncementPage).not.toContain('const initialData: AnnouncementFormData = {')
    expect(ownerPage).toMatch(/const OWNER_WORKSPACE_LINKS[\s\S]*?= \[/)
    expect(ownerPage).not.toContain('const workspaceLinks = [')
    expect(superAdminPage).toContain('const SUPER_ADMIN_QUICK_LINKS = [')
    expect(superAdminPage).not.toContain('const quickLinks = [')
    expect(brandLabView).toContain('const DASHBOARD_CONCEPT_ROWS = [')
    expect(brandLabView).not.toContain("const rows = ['Submitted for review'")
    expect(announcementCard).toContain('const STATUS_CHIP_STYLES')
    expect(announcementCard).not.toContain('const styles: Record<typeof tone, CSSProperties> = {')
    expect(announcementsClient).toContain('const EMPTY_STATE_MESSAGES')
    expect(announcementsClient).not.toContain('const messages: Record<AnnouncementTab')
    expect(backNavButton.indexOf('function hasKnownExternalReferrer()')).toBeLessThan(
      backNavButton.indexOf('export function BackNavButton')
    )
    expect(backNavButton).toContain('className="size-4"')
  })
})
