'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { canAccessAdminArea, getCurrentAccessContext } from '@/lib/auth/authz'

export async function reviewAnnouncement(announcementId: string, formData: FormData) {
  const access = await getCurrentAccessContext()
  if (!access) redirect('/login')
  if (!canAccessAdminArea(access.role)) redirect('/login')

  const action = formData.get('_action') as 'approve' | 'reject'
  const comment = (formData.get('comment') as string | null)?.trim() || null
  const supabase = await createClient()
  const { data: announcement } = await supabase
    .from('announcements')
    .select('organization_id, status')
    .eq('id', announcementId)
    .single()

  if (!announcement || announcement.status !== 'submitted') redirect('/admin/review')
  if (access.role === 'admin' && !access.orgIds.includes(announcement.organization_id)) {
    redirect('/admin/review')
  }

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
    reviewer_id: access.userId,
    action: action === 'approve' ? 'approved' : 'rejected',
    comment,
  })

  revalidatePath('/admin/review')
  revalidatePath('/admin')
  redirect('/admin/review')
}
