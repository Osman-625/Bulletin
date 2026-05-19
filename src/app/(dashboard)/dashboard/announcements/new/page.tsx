import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AnnouncementForm } from '@/components/dashboard/AnnouncementForm'
import { createAnnouncement, createAndSubmitAnnouncement } from './actions'
import { getWritableOrganizationId } from '@/lib/announcements/access'
import { getCurrentAccessContext } from '@/lib/auth/authz'
import {
  DEFAULT_DISPLAY_FONT,
  DEFAULT_DISPLAY_SIZE,
  DEFAULT_URGENCY,
} from '@/lib/announcements/presentation'
import type { AnnouncementFormData } from '@/components/dashboard/AnnouncementForm'

export const metadata = { title: 'New Announcement — Bulletin' }

export default async function NewAnnouncementPage() {
  const access = await getCurrentAccessContext()
  if (!access) redirect('/login')

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const organizationId = await getWritableOrganizationId(supabase, access)

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, color')
    .eq('is_active', true)
    .order('name')

  const initialData: AnnouncementFormData = {
    title: '',
    body: '',
    status: 'draft',
    category_id: null,
    banner_url: null,
    registration_link: null,
    expires_at: null,
    scheduled_publish_at: null,
    pinned_until: null,
    rejection_comment: null,
    view_count: 0,
    published_at: null,
    urgency: DEFAULT_URGENCY,
    display_font: DEFAULT_DISPLAY_FONT,
    display_size: DEFAULT_DISPLAY_SIZE,
  }

  return (
    <AnnouncementForm
      initialData={initialData}
      categories={categories ?? []}
      onSave={createAnnouncement}
      onSaveAndPublish={createAndSubmitAnnouncement}
      organizationId={organizationId}
      isNew
    />
  )
}
