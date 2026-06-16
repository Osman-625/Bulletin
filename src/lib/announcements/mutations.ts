import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  readAnnouncementScheduleFields,
  readOptionalBannerUrl,
  readOptionalHttpUrl,
} from '@/lib/announcements/form'
import type { Database } from '@/lib/database.types'

type BulletinSupabaseClient = SupabaseClient<Database>

type AnnouncementMutationFields = {
  categoryId: string | null
  bannerUrl: string | null
  registrationLink: string | null
  expiresAt: string | null
  scheduledPublishAt: string | null
  pinnedUntil: string | null
}

export async function readAnnouncementMutationFields(
  supabase: BulletinSupabaseClient,
  formData: FormData,
  {
    actorId,
    organizationId,
  }: {
    actorId: string
    organizationId: string
  }
): Promise<AnnouncementMutationFields> {
  const categoryId = await resolveAnnouncementCategoryId(
    supabase,
    formData.get('category_id'),
    organizationId
  )
  const bannerUrl = readOptionalBannerUrl(formData, 'banner_url', {
    userId: actorId,
    organizationId,
  })
  const registrationLink = readOptionalHttpUrl(formData, 'registration_link', 'Registration link')
  const { expiresAt, scheduledPublishAt, pinnedUntil } = readAnnouncementScheduleFields(formData)

  return {
    categoryId,
    bannerUrl,
    registrationLink,
    expiresAt,
    scheduledPublishAt,
    pinnedUntil,
  }
}

async function resolveAnnouncementCategoryId(
  supabase: BulletinSupabaseClient,
  value: FormDataEntryValue | null,
  organizationId: string
) {
  if (typeof value !== 'string' || value.trim() === '') return null

  const categoryId = value.trim()
  const { data: category, error: categoryError } = await supabase
    .from('categories')
    .select('id, is_active')
    .eq('id', categoryId)
    .maybeSingle()

  if (categoryError) throw new Error('Could not validate announcement category.')
  if (!category?.is_active) throw new Error('Choose an active category.')

  const { count: permissionCount, error: permissionCountError } = await supabase
    .from('org_category_permissions')
    .select('category_id', { count: 'exact', head: true })
    .eq('org_id', organizationId)

  if (permissionCountError) throw new Error('Could not validate organization category access.')
  if (!permissionCount) return category.id

  const { data: permission, error: permissionError } = await supabase
    .from('org_category_permissions')
    .select('category_id')
    .eq('org_id', organizationId)
    .eq('category_id', category.id)
    .maybeSingle()

  if (permissionError) throw new Error('Could not validate organization category access.')
  if (!permission) throw new Error('This organization cannot use the selected category.')

  return category.id
}
