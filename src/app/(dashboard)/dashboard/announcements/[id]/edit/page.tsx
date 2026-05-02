import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AnnouncementForm } from '@/components/dashboard/AnnouncementForm'
import {
  updateAnnouncement,
  submitForReview,
  unpublishAnnouncement,
  deleteAnnouncement,
} from './actions'
import type { AnnouncementFormData } from '@/components/dashboard/AnnouncementForm'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('announcements')
    .select('title')
    .eq('id', id)
    .single()
  return { title: data ? `Edit: ${data.title} — Bulletin` : 'Edit Announcement — Bulletin' }
}

export default async function EditAnnouncementPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: announcement }, { data: categories }, { data: membership }] = await Promise.all([
    supabase
      .from('announcements')
      .select(
        'id, title, body, status, category_id, banner_url, registration_link, expires_at, published_at, organization_id'
      )
      .eq('id', id)
      .single(),
    supabase
      .from('categories')
      .select('id, name, color')
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single(),
  ])

  if (!announcement) notFound()

  if (!membership || announcement.organization_id !== membership.organization_id) {
    redirect('/dashboard/announcements')
  }

  const initialData: AnnouncementFormData = {
    id: announcement.id,
    title: announcement.title,
    body: announcement.body ?? '',
    status: announcement.status,
    category_id: announcement.category_id,
    banner_url: announcement.banner_url,
    registration_link: announcement.registration_link,
    expires_at: announcement.expires_at,
    published_at: announcement.published_at,
  }

  return (
    <AnnouncementForm
      initialData={initialData}
      categories={categories ?? []}
      onSave={updateAnnouncement.bind(null, id)}
      onPublish={submitForReview.bind(null, id)}
      onUnpublish={unpublishAnnouncement.bind(null, id)}
      onDelete={deleteAnnouncement.bind(null, id)}
    />
  )
}
