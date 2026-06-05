import type { AnnouncementWithRelations } from '../types'
import type { DbCategory } from '../types'

export function matchesSearch(announcement: AnnouncementWithRelations, query: string): boolean {
  if (!query) return true
  const normalized = query.toLowerCase()
  return [
    announcement.title,
    announcement.body,
    announcement.categories?.name,
    announcement.organizations?.name,
  ].some((value) => value?.toLowerCase().includes(normalized))
}

export function derivePublicTopics(
  activeCategories: DbCategory[],
  announcements: AnnouncementWithRelations[]
): DbCategory[] {
  if (activeCategories.length > 0) return activeCategories

  const topics = new Map<string, DbCategory>()

  announcements.forEach((announcement) => {
    const category = announcement.categories
    if (!category || topics.has(category.slug)) return

    topics.set(category.slug, {
      id: category.id,
      name: category.name,
      slug: category.slug,
      color: category.color,
      is_active: true,
      created_at: '',
    })
  })

  return Array.from(topics.values()).toSorted((a, b) => a.name.localeCompare(b.name))
}
