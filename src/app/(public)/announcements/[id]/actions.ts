'use server'

import { headers } from 'next/headers'
import { reportServerError } from '@/shared/errors/error-reporting'
import { checkPersistentRateLimit } from '@/shared/middleware/persistent-rate-limit'
import { rateLimitKey } from '@/shared/middleware/rate-limit'
import { createServiceClient } from '@/infrastructure/database/server'

const VIEW_RATE_LIMIT = 30
const VIEW_RATE_LIMIT_WINDOW_MS = 60_000

export async function recordAnnouncementView(announcementId: string) {
  const normalizedAnnouncementId = announcementId.trim()
  if (!normalizedAnnouncementId) return

  // Key on IP only: keying per announcement would let one IP multiply the
  // limit by rotating announcement IDs to inflate view counts.
  const headerStore = await headers()
  const rateLimit = await checkPersistentRateLimit(rateLimitKey('announcement-view', headerStore), {
    limit: VIEW_RATE_LIMIT,
    windowMs: VIEW_RATE_LIMIT_WINDOW_MS,
  })

  if (rateLimit.limited) return

  const supabase = await createServiceClient()
  const { error } = await supabase.rpc('increment_announcement_view', {
    p_announcement_id: normalizedAnnouncementId,
  })

  if (error) {
    reportServerError('public.announcement_view.increment_failed', error, {
      announcementId: normalizedAnnouncementId,
    })
  }
}
