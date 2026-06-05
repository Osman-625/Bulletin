import { ArrowLeft } from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AnnouncementForm } from '@/components/dashboard/AnnouncementForm'
import { DashboardDeskHeader, DashboardDeskPage } from '@/components/dashboard/DashboardDesk'
import { createAnnouncement, createAndSubmitAnnouncement } from './actions'
import { getWritableOrganizationId } from '@/lib/announcements/access'
import { getCurrentAccessContext } from '@/lib/auth/authz'
import {
  DEFAULT_DISPLAY_FONT,
  DEFAULT_DISPLAY_SIZE,
  DEFAULT_URGENCY,
} from '@/lib/announcements/presentation'
import type { AnnouncementFormData } from '@/components/dashboard/AnnouncementForm'

export const metadata = { title: 'New Announcement' }

const NEW_ANNOUNCEMENT_INITIAL_DATA: AnnouncementFormData = {
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

export default async function NewAnnouncementPage() {
  const [access, supabase] = await Promise.all([getCurrentAccessContext(), createClient()])
  if (!access) redirect('/login')

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [organizationId, { data: categories }] = await Promise.all([
    getWritableOrganizationId(supabase, access),
    supabase.from('categories').select('id, name, color').eq('is_active', true).order('name'),
  ])

  return (
    <DashboardDeskPage className="new-announcement-page flex flex-col gap-5">
      <DashboardDeskHeader
        kicker="Publisher editor"
        title="New announcement"
        description="Write the notice first, then tune category, timing, and preview details before sending it for review."
        action={{
          href: '/dashboard/announcements',
          label: 'Announcement register',
          icon: ArrowLeft,
          variant: 'secondary',
        }}
      />

      <AnnouncementForm
        key="new"
        initialData={NEW_ANNOUNCEMENT_INITIAL_DATA}
        categories={categories ?? []}
        onSave={createAnnouncement}
        onSaveAndPublish={createAndSubmitAnnouncement}
        organizationId={organizationId}
        isNew
      />
    </DashboardDeskPage>
  )
}
