import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { GlassCard } from '@/components/dashboard/GlassCard'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'

export const metadata = { title: 'Categories — Bulletin Super Admin' }

async function createCategory(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const name = (formData.get('name') as string).trim()
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  const color = formData.get('color') as string
  const { error } = await supabase.from('categories').insert({ name, slug, color, is_active: true })
  if (error) redirect(`/super-admin/categories?error=${encodeURIComponent(error.message)}`)
  revalidatePath('/super-admin/categories')
  redirect('/super-admin/categories')
}

async function updateCategory(id: string, formData: FormData) {
  'use server'
  const supabase = await createClient()
  const name = (formData.get('name') as string).trim()
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  const color = formData.get('color') as string
  const { error } = await supabase.from('categories').update({ name, slug, color }).eq('id', id)
  if (error) redirect(`/super-admin/categories?error=${encodeURIComponent(error.message)}`)
  revalidatePath('/super-admin/categories')
  redirect('/super-admin/categories')
}

async function toggleCategory(id: string, isActive: boolean) {
  'use server'
  const supabase = await createClient()
  await supabase.from('categories').update({ is_active: isActive }).eq('id', id)
  revalidatePath('/super-admin/categories')
}

async function deleteCategory(id: string, force: boolean) {
  'use server'
  const supabase = await createServiceClient()
  if (!force) {
    const { count } = await supabase
      .from('announcements')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id)
    if ((count ?? 0) > 0) {
      redirect(`/super-admin/categories?error=${encodeURIComponent(`Category has ${count} linked announcement(s). Use force delete.`)}`)
    }
    await supabase.from('categories').delete().eq('id', id)
  } else {
    await supabase.from('announcements').update({ category_id: null }).eq('category_id', id)
    await supabase.from('categories').delete().eq('id', id)
  }
  revalidatePath('/super-admin/categories')
  redirect('/super-admin/categories')
}

export default async function CategoriesPage({
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
      .in('category_id', (categories ?? []).map((c) => c.id))
    for (const row of counts ?? []) {
      if (row.category_id) {
        announcementCounts[row.category_id] = (announcementCounts[row.category_id] ?? 0) + 1
      }
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)] tracking-tight">Categories</h1>
        <p className="text-[var(--color-text-secondary)] mt-1">{categories?.length ?? 0} categories</p>
      </div>

      {/* Create form */}
      <GlassCard hover={false} className="p-6">
        <h2 className="font-semibold text-[var(--color-text-primary)] mb-4">New Category</h2>
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-[var(--color-status-rejected-bg)] text-[var(--color-status-rejected-text)] text-sm">{error}</div>
        )}
        <form action={createCategory} className="flex items-end gap-3">
          <div className="flex-1 space-y-1.5">
            <label htmlFor="name" className="block text-xs font-medium text-[var(--color-text-secondary)]">Name</label>
            <input
              id="name" name="name" type="text" required
              placeholder="e.g. Academic"
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none input-inti"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="color" className="block text-xs font-medium text-[var(--color-text-secondary)]">Color</label>
            <input id="color" name="color" type="color" defaultValue="#C8102E"
              className="h-[42px] w-16 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-1 py-1 cursor-pointer"
            />
          </div>
          <button type="submit"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white transition-colors shrink-0">
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
            <GlassCard key={cat.id} hover={false} className={isEditing ? 'ring-1 ring-[var(--color-accent)]' : ''}>
              {!isEditing ? (
                <div className="px-5 py-3 flex items-center gap-4">
                  <span className="h-4 w-4 rounded-full shrink-0" style={{ background: cat.color ?? '#C8102E' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">{cat.name}</p>
                    <p className="text-xs font-mono text-[var(--color-text-muted)]">{cat.slug} {linkCount > 0 ? `· ${linkCount} linked` : ''}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <form action={async () => { 'use server'; await toggleCategory(cat.id, !cat.is_active) }}>
                      <button type="submit"
                        className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                          cat.is_active
                            ? 'bg-[var(--color-status-published-bg)] text-[var(--color-status-published-text)] hover:opacity-80'
                            : 'bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] hover:opacity-80'
                        }`}>
                        {cat.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </form>
                    <a
                      href={`/super-admin/categories?edit=${cat.id}`}
                      className="px-3 py-1 rounded-lg text-xs font-medium bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                    >
                      Edit
                    </a>
                    {linkCount === 0 ? (
                      <form action={deleteCategory.bind(null, cat.id, false)}>
                        <button type="submit"
                          className="px-3 py-1 rounded-lg text-xs font-medium text-[var(--color-destructive)] hover:bg-[var(--color-status-rejected-bg)] transition-colors">
                          Delete
                        </button>
                      </form>
                    ) : (
                      <form action={deleteCategory.bind(null, cat.id, true)}>
                        <button type="submit"
                          className="px-3 py-1 rounded-lg text-xs font-medium text-[var(--color-destructive)] hover:bg-[var(--color-status-rejected-bg)] transition-colors">
                          Force Delete ({linkCount})
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-5">
                  <form action={updateCategory.bind(null, cat.id)} className="flex items-end gap-3">
                    <div className="flex-1 space-y-1.5">
                      <label className="block text-xs font-medium text-[var(--color-text-secondary)]">Name</label>
                      <input
                        name="name" type="text" required defaultValue={cat.name}
                        className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] focus:outline-none input-inti"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-medium text-[var(--color-text-secondary)]">Color</label>
                      <input name="color" type="color" defaultValue={cat.color ?? '#C8102E'}
                        className="h-[42px] w-16 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-1 py-1 cursor-pointer"
                      />
                    </div>
                    <button type="submit"
                      className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white transition-colors shrink-0">
                      Save
                    </button>
                    <a href="/super-admin/categories"
                      className="px-5 py-2.5 rounded-xl text-sm font-medium bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors shrink-0">
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
