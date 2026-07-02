import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/infrastructure/database/server'
import { AnnouncementForm } from '@/components/dashboard/AnnouncementForm'
import { canManageAnnouncementForOrg } from '@/modules/announcements/access'
import {
  DEFAULT_DISPLAY_FONT,
  DEFAULT_DISPLAY_SIZE,
  DEFAULT_URGENCY,
} from '@/modules/announcements/presentation'
import { getCurrentAccessContext } from '@/modules/auth/authz'
import {
  updateAnnouncement,
  submitForReview,
  unpublishAnnouncement,
  deleteAnnouncement,
} from './actions'
import type { AnnouncementFormData } from '@/components/dashboard/AnnouncementForm'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, supabase] = await Promise.all([params, createClient()])
  const { data } = await supabase.from('announcements').select('title').eq('id', id).single()
  return { title: data ? `Edit: ${data.title}, Bulletin` : 'Edit Announcement, Bulletin' }
}

export default async function EditAnnouncementPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [{ id }, access, supabase] = await Promise.all([
    params,
    getCurrentAccessContext(),
    createClient(),
  ])
  if (!access) redirect('/login')

  const [{ data: announcement }, { data: categories }] = await Promise.all([
    supabase
      .from('announcements')
      .select(
        'id, title, body, status, category_id, banner_url, registration_link, expires_at, scheduled_publish_at, pinned_until, rejection_comment, view_count, published_at, organization_id, urgency, display_font, display_size'
      )
      .eq('id', id)
      .single(),
    supabase.from('categories').select('id, name, color').eq('is_active', true).order('name'),
  ])

  if (!announcement) notFound()

  if (!canManageAnnouncementForOrg(access, announcement.organization_id)) {
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
    scheduled_publish_at: announcement.scheduled_publish_at,
    pinned_until: announcement.pinned_until,
    rejection_comment: announcement.rejection_comment,
    view_count: announcement.view_count ?? 0,
    published_at: announcement.published_at,
    urgency: announcement.urgency ?? DEFAULT_URGENCY,
    display_font: announcement.display_font ?? DEFAULT_DISPLAY_FONT,
    display_size: announcement.display_size ?? DEFAULT_DISPLAY_SIZE,
  }

  return (
    <AnnouncementForm
      key={initialData.id}
      initialData={initialData}
      categories={categories ?? []}
      onSave={updateAnnouncement.bind(null, id)}
      onPublish={submitForReview.bind(null, id)}
      onUnpublish={unpublishAnnouncement.bind(null, id)}
      onDelete={deleteAnnouncement.bind(null, id)}
      organizationId={announcement.organization_id}
      backHref="/dashboard/announcements"
    />
  )
}
