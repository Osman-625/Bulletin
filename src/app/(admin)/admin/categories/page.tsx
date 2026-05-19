import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { GlassCard } from '@/components/dashboard/GlassCard'
import { logAuditEvent } from '@/lib/audit'
import { canAccessAdminArea, getCurrentAccessContext, getDefaultAppPath } from '@/lib/auth/authz'
import { reportServerError } from '@/lib/error-reporting'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'

export const metadata = { title: 'Categories — Bulletin Admin' }

const CATEGORY_PATH = '/admin/categories'
const CATEGORY_SAVE_ERROR = 'Could not save category. Try again.'
const CATEGORY_TOGGLE_ERROR = 'Could not update category status. Try again.'
const CATEGORY_DELETE_ERROR = 'Could not delete category. Try again.'

function categoryErrorHref(message: string) {
  return `${CATEGORY_PATH}?error=${encodeURIComponent(message)}`
}

async function requireAdminAccess() {
  const access = await getCurrentAccessContext()
  if (!access) redirect('/login')
  if (!canAccessAdminArea(access.role)) redirect(getDefaultAppPath(access.role))
  return access
}

async function createCategory(formData: FormData) {
  'use server'
  const access = await requireAdminAccess()
  const supabase = await createClient()
  const name = (formData.get('name') as string).trim()
  const slug = name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
  const color = formData.get('color') as string
  const { data: category, error } = await supabase
    .from('categories')
    .insert({ name, slug, color, is_active: true })
    .select('id')
    .single()
  if (error) {
    reportServerError('admin.categories.create', error, { actorId: access.userId, name, slug })
    redirect(categoryErrorHref(CATEGORY_SAVE_ERROR))
  }
  await logAuditEvent({
    actorId: access.userId,
    action: 'category.created',
    targetType: 'category',
    targetId: category.id,
    metadata: { name, slug, color, is_active: true },
  })
  revalidatePath('/admin/categories')
  redirect('/admin/categories')
}

async function updateCategory(id: string, formData: FormData) {
  'use server'
  const access = await requireAdminAccess()
  const supabase = await createClient()
  const name = (formData.get('name') as string).trim()
  const slug = name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
  const color = formData.get('color') as string
  const { error } = await supabase.from('categories').update({ name, slug, color }).eq('id', id)
  if (error) {
    reportServerError('admin.categories.update', error, {
      actorId: access.userId,
      targetId: id,
      name,
      slug,
    })
    redirect(categoryErrorHref(CATEGORY_SAVE_ERROR))
  }
  await logAuditEvent({
    actorId: access.userId,
    action: 'category.updated',
    targetType: 'category',
    targetId: id,
    metadata: { name, slug, color },
  })
  revalidatePath('/admin/categories')
  redirect('/admin/categories')
}

async function toggleCategory(id: string, isActive: boolean) {
  'use server'
  const access = await requireAdminAccess()
  const supabase = await createClient()
  const { error: toggleError } = await supabase
    .from('categories')
    .update({ is_active: isActive })
    .eq('id', id)
  if (toggleError) {
    reportServerError('admin.categories.toggle', toggleError, {
      actorId: access.userId,
      targetId: id,
      isActive,
    })
    redirect(categoryErrorHref(CATEGORY_TOGGLE_ERROR))
  }
  const service = await createServiceClient()
  const { data: category } = await service
    .from('categories')
    .select('name, slug')
    .eq('id', id)
    .single()
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
  revalidatePath('/admin/categories')
}

async function deleteCategory(id: string) {
  'use server'
  const access = await requireAdminAccess()
  const supabase = await createServiceClient()
  const { data: category, error: categoryError } = await supabase
    .from('categories')
    .select('name, slug, color')
    .eq('id', id)
    .single()
  if (categoryError) {
    reportServerError('admin.categories.read_for_delete', categoryError, {
      actorId: access.userId,
      targetId: id,
    })
    redirect(categoryErrorHref(CATEGORY_DELETE_ERROR))
  }
  const { count, error: countError } = await supabase
    .from('announcements')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', id)
  if (countError) {
    reportServerError('admin.categories.count_links', countError, {
      actorId: access.userId,
      targetId: id,
    })
    redirect(categoryErrorHref(CATEGORY_DELETE_ERROR))
  }
  if ((count ?? 0) > 0) {
    redirect(
      `/admin/categories?error=${encodeURIComponent(`Cannot delete: category has ${count} linked announcement(s). Contact a Super Admin for force delete.`)}`
    )
  }
  const { error: deleteError } = await supabase.from('categories').delete().eq('id', id)
  if (deleteError) {
    reportServerError('admin.categories.delete', deleteError, {
      actorId: access.userId,
      targetId: id,
    })
    redirect(categoryErrorHref(CATEGORY_DELETE_ERROR))
  }
  await logAuditEvent({
    actorId: access.userId,
    action: 'category.deleted',
    targetType: 'category',
    targetId: id,
    metadata: {
      name: category?.name ?? null,
      slug: category?.slug ?? null,
      color: category?.color ?? null,
      linked_announcements: count ?? 0,
    },
  })
  revalidatePath('/admin/categories')
  redirect('/admin/categories')
}

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; edit?: string }>
}) {
  const { error, edit } = await searchParams
  const supabase = await createServiceClient()
  const { data: categories } = await supabase.from('categories').select('*').order('name')

  const announcementCounts: Record<string, number> = {}
  if (categories?.length) {
    const { data: counts } = await supabase
      .from('announcements')
      .select('category_id')
      .in(
        'category_id',
        (categories ?? []).map((c) => c.id)
      )
    for (const row of counts ?? []) {
      if (row.category_id) {
        announcementCounts[row.category_id] = (announcementCounts[row.category_id] ?? 0) + 1
      }
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-6 py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
          Categories
        </h1>
        <p className="mt-1 text-[var(--color-text-secondary)]">
          {categories?.length ?? 0} categories
        </p>
      </div>

      {/* Create form */}
      <GlassCard hover={false} className="p-6">
        <h2 className="mb-4 font-semibold text-[var(--color-text-primary)]">New Category</h2>
        {error && (
          <div className="mb-4 rounded-xl bg-[var(--color-status-rejected-bg)] px-4 py-3 text-sm text-[var(--color-status-rejected-text)]">
            {error}
          </div>
        )}
        <form action={createCategory} className="flex items-end gap-3">
          <div className="flex-1 space-y-1.5">
            <label
              htmlFor="name"
              className="block text-xs font-medium text-[var(--color-text-secondary)]"
            >
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="e.g. Academic"
              className="input-inti w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="color"
              className="block text-xs font-medium text-[var(--color-text-secondary)]"
            >
              Color
            </label>
            <input
              id="color"
              name="color"
              type="color"
              defaultValue="#C8102E"
              className="h-[42px] w-16 cursor-pointer rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-1 py-1"
            />
          </div>
          <button
            type="submit"
            className="shrink-0 rounded-xl bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)]"
          >
            Add
          </button>
        </form>
      </GlassCard>

      {/* Category list */}
      <div className="space-y-2">
        {(categories ?? []).map((cat) => {
          const isEditing = edit === cat.id
          const linkCount = announcementCounts[cat.id] ?? 0

          return (
            <GlassCard
              key={cat.id}
              hover={false}
              className={isEditing ? 'ring-1 ring-[var(--color-accent)]' : ''}
            >
              {!isEditing ? (
                <div className="flex items-center gap-4 px-5 py-3">
                  <span
                    className="h-4 w-4 shrink-0 rounded-full"
                    style={{ background: cat.color ?? '#C8102E' }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">
                      {cat.name}
                    </p>
                    <p className="font-mono text-xs text-[var(--color-text-muted)]">
                      {cat.slug} {linkCount > 0 ? `· ${linkCount} linked` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <form
                      action={async () => {
                        'use server'
                        await toggleCategory(cat.id, !cat.is_active)
                      }}
                    >
                      <button
                        type="submit"
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                          cat.is_active
                            ? 'bg-[var(--color-status-published-bg)] text-[var(--color-status-published-text)] hover:opacity-80'
                            : 'bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] hover:opacity-80'
                        }`}
                      >
                        {cat.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </form>
                    <a
                      href={`/admin/categories?edit=${cat.id}`}
                      className="rounded-lg bg-[var(--color-surface-elevated)] px-3 py-1 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
                    >
                      Edit
                    </a>
                    {linkCount === 0 ? (
                      <form action={deleteCategory.bind(null, cat.id)}>
                        <button
                          type="submit"
                          className="rounded-lg px-3 py-1 text-xs font-medium text-[var(--color-destructive)] transition-colors hover:bg-[var(--color-status-rejected-bg)]"
                        >
                          Delete
                        </button>
                      </form>
                    ) : (
                      <span className="rounded-lg px-3 py-1 text-xs font-medium text-[var(--color-text-muted)]">
                        {linkCount} linked
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-5">
                  <form action={updateCategory.bind(null, cat.id)} className="flex items-end gap-3">
                    <div className="flex-1 space-y-1.5">
                      <label className="block text-xs font-medium text-[var(--color-text-secondary)]">
                        Name
                      </label>
                      <input
                        name="name"
                        type="text"
                        required
                        defaultValue={cat.name}
                        className="input-inti w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-[var(--color-text-secondary)]">
                        Color
                      </label>
                      <input
                        name="color"
                        type="color"
                        defaultValue={cat.color ?? '#C8102E'}
                        className="h-[42px] w-16 cursor-pointer rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-1 py-1"
                      />
                    </div>
                    <button
                      type="submit"
                      className="shrink-0 rounded-xl bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)]"
                    >
                      Save
                    </button>
                    <a
                      href="/admin/categories"
                      className="shrink-0 rounded-xl bg-[var(--color-surface-elevated)] px-5 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
                    >
                      Cancel
                    </a>
                  </form>
                </div>
              )}
            </GlassCard>
          )
        })}
      </div>
    </div>
  )
}
