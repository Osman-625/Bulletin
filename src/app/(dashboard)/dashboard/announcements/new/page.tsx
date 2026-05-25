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

export const metadata = { title: 'New Announcement' }

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
    <main className="dashboard-page new-announcement-page w-full py-5 sm:py-8 lg:py-10">
      <section className="new-announcement-intro mx-auto mb-5 w-full max-w-[82rem] px-4 sm:px-6 lg:px-8">
        <div className="dashboard-command-card rounded-[1.5rem] p-5 sm:p-6">
          <p className="future-kicker">Publisher editor</p>
          <h1 className="font-display mt-3 text-3xl leading-tight font-extrabold text-[var(--color-text-primary)] sm:text-4xl">
            New announcement
          </h1>
          <p className="mt-3 max-w-[62ch] text-sm leading-6 text-[var(--color-text-secondary)]">
            Write the notice first, then tune category, timing, and preview details before sending
            it for review.
          </p>
        </div>
      </section>

      <AnnouncementForm
        initialData={initialData}
        categories={categories ?? []}
        onSave={createAnnouncement}
        onSaveAndPublish={createAndSubmitAnnouncement}
        organizationId={organizationId}
        isNew
      />
    </main>
  )
}
