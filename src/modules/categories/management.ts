import 'server-only'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { logAuditEvent } from '@/modules/audit'
import type { AccessContext } from '@/modules/auth/authz'
import { readCategoryFormData } from '@/modules/categories/validation'
import { reportServerError } from '@/shared/errors/error-reporting'
import { checkActionRateLimit } from '@/shared/middleware/action-rate-limit'
import { createClient, createServiceClient } from '@/infrastructure/database/server'

const CATEGORY_SAVE_ERROR = 'Could not save category. Try again.'
const CATEGORY_TOGGLE_ERROR = 'Could not update category status. Try again.'
const CATEGORY_DELETE_ERROR = 'Could not delete category. Try again.'
const CATEGORY_RATE_LIMIT_ERROR = 'Too many category updates. Try again shortly.'

/** What differs between the admin, owner and super-admin category pages. */
type CategoryScope = {
  basePath: string
  /** `super-admin` gives rate-limit keys like `super-admin-category-create`. */
  rateLimitPrefix: string
  /** `super_admin` gives error-report contexts like `super_admin.categories.create`. */
  logPrefix: string
  /** Owners write with the service role; the other roles write through RLS. */
  writeWithServiceRole: boolean
  allowForceDelete: boolean
}

export const ADMIN_CATEGORY_SCOPE: CategoryScope = {
  basePath: '/admin/categories',
  rateLimitPrefix: 'admin',
  logPrefix: 'admin',
  writeWithServiceRole: false,
  allowForceDelete: false,
}

export const OWNER_CATEGORY_SCOPE: CategoryScope = {
  basePath: '/owner/categories',
  rateLimitPrefix: 'owner',
  logPrefix: 'owner',
  writeWithServiceRole: true,
  allowForceDelete: true,
}

export const SUPER_ADMIN_CATEGORY_SCOPE: CategoryScope = {
  basePath: '/super-admin/categories',
  rateLimitPrefix: 'super-admin',
  logPrefix: 'super_admin',
  writeWithServiceRole: false,
  allowForceDelete: true,
}

function errorHref(scope: CategoryScope, message: string) {
  return `${scope.basePath}?error=${encodeURIComponent(message)}`
}

async function enforceRateLimit(scope: CategoryScope, action: string, key: string) {
  const rateLimit = await checkActionRateLimit(`${scope.rateLimitPrefix}-category-${action}`, key)
  if (rateLimit.limited) redirect(errorHref(scope, CATEGORY_RATE_LIMIT_ERROR))
}

function writeClient(scope: CategoryScope) {
  return scope.writeWithServiceRole ? createServiceClient() : createClient()
}

/** Callers must have checked the actor's role before calling anything below. */
export async function createCategoryRecord(
  scope: CategoryScope,
  access: AccessContext,
  formData: FormData
) {
  const parsed = readCategoryFormData(formData)
  if (!parsed.ok) redirect(errorHref(scope, parsed.error))

  const { name, slug, color } = parsed.data
  await enforceRateLimit(scope, 'create', access.userId)
  const supabase = await writeClient(scope)
  const { data: category, error } = await supabase
    .from('categories')
    .insert({ name, slug, color, is_active: true })
    .select('id')
    .single()
  if (error) {
    reportServerError(`${scope.logPrefix}.categories.create`, error, {
      actorId: access.userId,
      name,
      slug,
    })
    redirect(errorHref(scope, CATEGORY_SAVE_ERROR))
  }
  await logAuditEvent({
    actorId: access.userId,
    action: 'category.created',
    targetType: 'category',
    targetId: category.id,
    metadata: { name, slug, color, is_active: true },
  })
  revalidatePath(scope.basePath)
  redirect(scope.basePath)
}

export async function updateCategoryRecord(
  scope: CategoryScope,
  access: AccessContext,
  id: string,
  formData: FormData
) {
  const parsed = readCategoryFormData(formData)
  if (!parsed.ok) redirect(errorHref(scope, parsed.error))

  const { name, slug, color } = parsed.data
  await enforceRateLimit(scope, 'update', `${access.userId}:${id}`)
  const supabase = await writeClient(scope)
  const { error } = await supabase.from('categories').update({ name, slug, color }).eq('id', id)
  if (error) {
    reportServerError(`${scope.logPrefix}.categories.update`, error, {
      actorId: access.userId,
      targetId: id,
      name,
      slug,
    })
    redirect(errorHref(scope, CATEGORY_SAVE_ERROR))
  }
  await logAuditEvent({
    actorId: access.userId,
    action: 'category.updated',
    targetType: 'category',
    targetId: id,
    metadata: { name, slug, color },
  })
  revalidatePath(scope.basePath)
  redirect(scope.basePath)
}

export async function toggleCategoryRecord(
  scope: CategoryScope,
  access: AccessContext,
  id: string,
  isActive: boolean
) {
  const [, supabase, service] = await Promise.all([
    enforceRateLimit(scope, 'toggle', `${access.userId}:${id}`),
    writeClient(scope),
    createServiceClient(),
  ])
  const [{ error: toggleError }, { data: category }] = await Promise.all([
    supabase.from('categories').update({ is_active: isActive }).eq('id', id),
    service.from('categories').select('name, slug').eq('id', id).single(),
  ])
  if (toggleError) {
    reportServerError(`${scope.logPrefix}.categories.toggle`, toggleError, {
      actorId: access.userId,
      targetId: id,
      isActive,
    })
    redirect(errorHref(scope, CATEGORY_TOGGLE_ERROR))
  }
  await logAuditEvent({
    actorId: access.userId,
    action: isActive ? 'category.activated' : 'category.deactivated',
    targetType: 'category',
    targetId: id,
    metadata: {
      name: category?.name ?? null,
      slug: category?.slug ?? null,
      is_active: isActive,
    },
  })
  revalidatePath(scope.basePath)
}

export async function deleteCategoryRecord(
  scope: CategoryScope,
  access: AccessContext,
  id: string,
  requestedForce: boolean
) {
  // Roles without force delete can't get it by posting force=true.
  const force = requestedForce && scope.allowForceDelete
  await enforceRateLimit(scope, 'delete', `${access.userId}:${id}`)
  const supabase = await createServiceClient()
  const [{ data: category, error: categoryError }, { count, error: countError }] =
    await Promise.all([
      supabase.from('categories').select('name, slug, color').eq('id', id).single(),
      supabase
        .from('announcements')
        .select('id', { count: 'exact', head: true })
        .eq('category_id', id),
    ])
  if (categoryError) {
    reportServerError(`${scope.logPrefix}.categories.read_for_delete`, categoryError, {
      actorId: access.userId,
      targetId: id,
    })
    redirect(errorHref(scope, CATEGORY_DELETE_ERROR))
  }
  if (countError) {
    reportServerError(`${scope.logPrefix}.categories.count_links`, countError, {
      actorId: access.userId,
      targetId: id,
    })
    redirect(errorHref(scope, CATEGORY_DELETE_ERROR))
  }
  const linkedCount = count ?? 0
  if (!force && linkedCount > 0) {
    redirect(
      errorHref(
        scope,
        scope.allowForceDelete
          ? `Category has ${linkedCount} linked announcement(s). Use force delete.`
          : `Cannot delete: category has ${linkedCount} linked announcement(s). Contact a Super Admin for force delete.`
      )
    )
  }
  if (force) {
    const { error: announcementUpdateError } = await supabase
      .from('announcements')
      .update({ category_id: null })
      .eq('category_id', id)
    if (announcementUpdateError) {
      reportServerError(
        `${scope.logPrefix}.categories.force_delete_unlink`,
        announcementUpdateError,
        { actorId: access.userId, targetId: id }
      )
      redirect(errorHref(scope, CATEGORY_DELETE_ERROR))
    }
  }
  const { error: deleteError } = await supabase.from('categories').delete().eq('id', id)
  if (deleteError) {
    reportServerError(
      force ? `${scope.logPrefix}.categories.force_delete` : `${scope.logPrefix}.categories.delete`,
      deleteError,
      { actorId: access.userId, targetId: id }
    )
    redirect(errorHref(scope, CATEGORY_DELETE_ERROR))
  }
  await logAuditEvent({
    actorId: access.userId,
    action: force ? 'category.force_deleted' : 'category.deleted',
    targetType: 'category',
    targetId: id,
    metadata: {
      name: category?.name ?? null,
      slug: category?.slug ?? null,
      color: category?.color ?? null,
      linked_announcements: linkedCount,
    },
  })
  revalidatePath(scope.basePath)
  redirect(scope.basePath)
}

/** Reads with the service role, so callers must have checked the actor's role first. */
export async function loadCategoryList() {
  const supabase = await createServiceClient()
  const { data } = await supabase
    .from('categories')
    .select('id, name, slug, color, is_active, created_at')
    .order('name')
  const categories = data ?? []

  // One exact count per category: a single select of every announcement stops at the API row cap.
  const countResults = await Promise.all(
    categories.map((category) =>
      supabase
        .from('announcements')
        .select('id', { count: 'exact', head: true })
        .eq('category_id', category.id)
    )
  )
  const failedCount = countResults.find((result) => result.error)
  if (failedCount?.error) reportServerError('categories.link_count_failed', failedCount.error)
  const announcementCounts = Object.fromEntries(
    categories.map((category, index) => [category.id, countResults[index]?.count ?? 0])
  )

  return { categories, announcementCounts }
}
