import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AnnouncementForm } from '@/components/dashboard/AnnouncementForm'
import { createAnnouncement, createAndPublishAnnouncement } from './actions'
import type { AnnouncementFormData } from '@/components/dashboard/AnnouncementForm'

export const metadata = { title: 'New Announcement — Bulletin' }

export default async function NewAnnouncementPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

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
    published_at: null,
  }

  return (
    <AnnouncementForm
      initialData={initialData}
      categories={categories ?? []}
      onSave={createAnnouncement}
      onPublish={async () => {}}
      onSaveAndPublish={createAndPublishAnnouncement}
      isNew
    />
  )
}
