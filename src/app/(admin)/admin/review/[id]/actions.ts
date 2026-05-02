'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function reviewAnnouncement(announcementId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const action = formData.get('_action') as 'approve' | 'reject'
  const comment = (formData.get('comment') as string | null)?.trim() || null

  if (action === 'approve') {
    await supabase.from('announcements').update({
      status: 'published',
      published_at: new Date().toISOString(),
      rejection_comment: null,
    }).eq('id', announcementId)
  } else {
    await supabase.from('announcements').update({
      status: 'rejected',
      rejection_comment: comment ?? 'No reason provided.',
    }).eq('id', announcementId)
  }

  await supabase.from('announcement_reviews').insert({
    announcement_id: announcementId,
    reviewer_id: user.id,
    action,
    comment,
  })

  revalidatePath('/admin/review')
  revalidatePath('/admin')
  redirect('/admin/review')
}
