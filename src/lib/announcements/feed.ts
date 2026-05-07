import type { AnnouncementWithRelations } from '../types'

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
