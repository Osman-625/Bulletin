import type { BoardSort } from '@/lib/announcements/public-board'

export function buildFeedHref({
  category,
  q,
  sort,
  page,
}: {
  category?: string
  q?: string
  sort: BoardSort
  page?: number
}) {
  const params = new URLSearchParams()
  if (category) params.set('category', category)
  if (q) params.set('q', q)
  if (sort !== 'priority') params.set('sort', sort)
  if (page && page > 1) params.set('page', String(page))
  const query = params.toString()
  return query ? `/?${query}` : '/'
}
