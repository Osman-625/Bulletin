import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

function source(path: string) {
  return readFileSync(path, 'utf8')
}

describe('data helper error handling source guards', () => {
  it('logs Supabase read failures for admin and platform data helpers', () => {
    const data = source('src/infrastructure/database/data.ts')

    expect(data).toContain("from '@/shared/errors/error-reporting'")
    expect(data).toContain('reviewListError')
    expect(data).toContain('reviewAnnouncementError')
    expect(data).toContain('organizationsError')
    expect(data).toContain('publishersError')
    expect(data).toContain('visibleUsersError')
    expect(data).toContain('adminsError')
    expect(data).toContain('platformStatsError')
    expect(data).toContain('reportServerError(`data.${status}_announcements.query_failed`')
    expect(data).toContain("reportServerError('data.review_announcement.query_failed'")
    expect(data).toContain("reportServerError('data.organizations.query_failed'")
    expect(data).toContain("reportServerError('data.publishers.query_failed'")
    expect(data).toContain("reportServerError('data.visible_users.query_failed'")
    expect(data).toContain("reportServerError('data.admins.query_failed'")
    expect(data).toContain("reportServerError('data.platform_stats.query_failed'")
  })

  it('checks admin stats query errors before returning dashboard numbers', () => {
    const data = source('src/infrastructure/database/data.ts')

    expect(data).toContain('pendingReviewError')
    expect(data).toContain('publishedThisMonthError')
    expect(data).toContain('totalOrgsError')
    expect(data).toContain('adminStatsPublishersError')
    expect(data).toContain('adminStatsError')
    expect(data).toContain("reportServerError('data.admin_stats.query_failed'")
  })
})
