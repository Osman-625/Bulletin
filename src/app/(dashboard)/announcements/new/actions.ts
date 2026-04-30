'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createAnnouncement(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Get org membership
  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!membership?.organization_id) throw new Error('No organization')

  const title = (formData.get('title') as string) || 'Untitled Announcement'
  const body = (formData.get('body') as string) || ''
  const categoryId = formData.get('category_id') as string | null
  const bannerUrl = formData.get('banner_url') as string | null
  const registrationLink = formData.get('registration_link') as string | null
  const expiresAt = formData.get('expires_at') as string | null

  const { data: announcement, error } = await supabase
    .from('announcements')
    .insert({
      title,
      body,
      status: 'draft',
      category_id: categoryId || null,
      organization_id: membership.organization_id,
      author_id: user.id,
      banner_url: bannerUrl || null,
      registration_link: registrationLink || null,
      expires_at: expiresAt || null,
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/announcements')
  redirect(`/dashboard/announcements/${announcement.id}/edit`)
}

export async function createAndPublishAnnouncement(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!membership?.organization_id) throw new Error('No organization')

  const title = (formData.get('title') as string) || 'Untitled Announcement'
  const body = (formData.get('body') as string) || ''
  const categoryId = formData.get('category_id') as string | null
  const bannerUrl = formData.get('banner_url') as string | null
  const registrationLink = formData.get('registration_link') as string | null
  const expiresAt = formData.get('expires_at') as string | null
  const now = new Date().toISOString()

  const { data: announcement, error } = await supabase
    .from('announcements')
    .insert({
      title,
      body,
      status: 'published',
      published_at: now,
      category_id: categoryId || null,
      organization_id: membership.organization_id,
      author_id: user.id,
      banner_url: bannerUrl || null,
      registration_link: registrationLink || null,
      expires_at: expiresAt || null,
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/announcements')
  redirect(`/dashboard/announcements/${announcement.id}/edit`)
}
