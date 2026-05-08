'use server'

import { createClient } from '@/lib/supabase/server'

export async function recordAnnouncementView(announcementId: string) {
  if (!announcementId) return

  const supabase = await createClient()
  const { error } = await supabase.rpc('increment_announcement_view', {
    p_announcement_id: announcementId,
  })

  if (error) {
    console.error('[recordAnnouncementView]', error.message, error.code)
  }
}
