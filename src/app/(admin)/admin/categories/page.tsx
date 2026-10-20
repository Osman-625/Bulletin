import Link from 'next/link'
import { redirect } from 'next/navigation'
import { GlassCard } from '@/components/dashboard/GlassCard'
import { DashboardBoardHeader, DashboardBoardPage } from '@/components/dashboard/DashboardBoard'
import {
  canAccessAdminArea,
  getCurrentAccessContext,
  getDefaultAppPath,
} from '@/modules/auth/authz'
import {
  ADMIN_CATEGORY_SCOPE,
  createCategoryRecord,
  deleteCategoryRecord,
  loadCategoryList,
  toggleCategoryRecord,
  updateCategoryRecord,
} from '@/modules/categories/management'
import { DEFAULT_CATEGORY_COLOR as DEFAULT_CATEGORY_INPUT_COLOR } from '@/modules/categories/validation'

export const metadata = { title: 'Categories — Bulletin Admin' }

const DEFAULT_CATEGORY_COLOR = 'var(--color-accent-inti)'

async function requireAdminAccess() {
  const access = await getCurrentAccessContext()
  if (!access) redirect('/login')
  if (!canAccessAdminArea(access.role)) redirect(getDefaultAppPath(access.role))
  return access
}

async function createCategory(formData: FormData) {
  'use server'
  await createCategoryRecord(ADMIN_CATEGORY_SCOPE, await requireAdminAccess(), formData)
}

async function updateCategory(id: string, formData: FormData) {
  'use server'
  await updateCategoryRecord(ADMIN_CATEGORY_SCOPE, await requireAdminAccess(), id, formData)
}

async function toggleCategory(id: string, isActive: boolean) {
  'use server'
  await toggleCategoryRecord(ADMIN_CATEGORY_SCOPE, await requireAdminAccess(), id, isActive)
}

async function deleteCategory(id: string) {
  'use server'
  await deleteCategoryRecord(ADMIN_CATEGORY_SCOPE, await requireAdminAccess(), id, false)
}

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; edit?: string }>
}) {
  const [{ error, edit }, { categories, announcementCounts }] = await Promise.all([
    searchParams,
    requireAdminAccess().then(loadCategoryList),
  ])
  const hasCategories = categories.length > 0

  return (
    <DashboardBoardPage className="flex flex-col gap-5">
      <DashboardBoardHeader
        kicker="Taxonomy"
        title="Categories"
        description={`${categories?.length ?? 0} categor${(categories?.length ?? 0) === 1 ? 'y' : 'ies'} available for organizing campus announcements.`}
      />

      <div className="grid gap-4 xl:grid-cols-[24rem_minmax(0,1fr)]">
        {/* Create form */}
        <GlassCard hover={false} className="p-6 xl:sticky xl:top-5 xl:self-start">
          <h2 className="mb-4 font-semibold text-[var(--color-text-primary)]">New Category</h2>
          {error && (
            <div className="mb-4 rounded-[var(--radius-control)] bg-[var(--color-status-rejected-bg)] px-4 py-3 text-sm text-[var(--color-status-rejected-text)]">
              {error}
            </div>
          )}
          <form action={createCategory} className="grid gap-3">
            <div className="space-y-1.5">
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
                className="input-inti w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-[1fr_auto] items-end gap-3">
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
                  defaultValue={DEFAULT_CATEGORY_INPUT_COLOR}
                  className="h-[42px] w-16 cursor-pointer rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1"
                />
              </div>
              <button
                type="submit"
                className="shrink-0 rounded-[var(--radius-control)] bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)]"
              >
                Add
              </button>
            </div>
          </form>
        </GlassCard>

        {/* Category list */}
        <div className="space-y-2">
          {hasCategories ? (
            (categories ?? []).map((cat) => {
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
                        className="size-4 shrink-0 rounded-full"
                        style={{ background: cat.color ?? DEFAULT_CATEGORY_COLOR }}
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
                        <Link
                          href={`/admin/categories?edit=${cat.id}`}
                          className="rounded-lg bg-[var(--color-surface-elevated)] px-3 py-1 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
                        >
                          Edit
                        </Link>
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
                      <form
                        action={updateCategory.bind(null, cat.id)}
                        className="flex items-end gap-3"
                      >
                        <div className="flex-1 space-y-1.5">
                          <label
                            htmlFor={`admin-category-name-${cat.id}`}
                            className="block text-xs font-medium text-[var(--color-text-secondary)]"
                          >
                            Name
                          </label>
                          <input
                            id={`admin-category-name-${cat.id}`}
                            name="name"
                            type="text"
                            aria-label={`Category name for ${cat.name}`}
                            required
                            defaultValue={cat.name}
                            className="input-inti w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label
                            htmlFor={`admin-category-color-${cat.id}`}
                            className="block text-xs font-medium text-[var(--color-text-secondary)]"
                          >
                            Color
                          </label>
                          <input
                            id={`admin-category-color-${cat.id}`}
                            name="color"
                            type="color"
                            aria-label={`Category color for ${cat.name}`}
                            defaultValue={cat.color ?? DEFAULT_CATEGORY_INPUT_COLOR}
                            className="h-[42px] w-16 cursor-pointer rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1"
                          />
                        </div>
                        <button
                          type="submit"
                          className="shrink-0 rounded-xl bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)]"
                        >
                          Save
                        </button>
                        <Link
                          href="/admin/categories"
                          className="shrink-0 rounded-xl bg-[var(--color-surface-elevated)] px-5 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
                        >
                          Cancel
                        </Link>
                      </form>
                    </div>
                  )}
                </GlassCard>
              )
            })
          ) : (
            <GlassCard hover={false} className="p-8">
              <output className="mx-auto block max-w-md text-center">
                <span className="block text-sm font-semibold text-[var(--color-text-primary)]">
                  No categories yet
                </span>
                <span className="mt-1 block text-sm text-[var(--color-text-secondary)]">
                  Create the first category above so publishers can classify announcements.
                </span>
              </output>
            </GlassCard>
          )}
        </div>
      </div>
    </DashboardBoardPage>
  )
}
