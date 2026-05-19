'use server'

import { reportServerError } from '@/lib/error-reporting'
import { createClient } from '@/lib/supabase/server'

export async function recordAnnouncementView(announcementId: string) {
  if (!announcementId) return

  const supabase = await createClient()
  const { error } = await supabase.rpc('increment_announcement_view', {
    p_announcement_id: announcementId,
  })

  if (error) {
    reportServerError('public.announcement_view.increment_failed', error, {
      announcementId,
    })
  }
}
