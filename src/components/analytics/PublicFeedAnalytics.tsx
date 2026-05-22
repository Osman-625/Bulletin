'use client'

import { useEffect } from 'react'
import { captureProductEvent } from '@/lib/product-analytics'

export function PublicFeedAnalytics({
  category,
  searchLength,
  sort,
  page,
  visibleCount,
  total,
}: {
  category?: string | null
  searchLength: number
  sort: string
  page: number
  visibleCount: number
  total: number
}) {
  useEffect(() => {
    const properties = {
      category: category || 'all',
      has_search: searchLength > 0,
      searchLength,
      sort,
      page,
      visible_count: visibleCount,
      total,
    }

    captureProductEvent('public_feed_viewed', properties)

    if (searchLength > 0) {
      captureProductEvent('public_feed_searched', properties)
    }
  }, [category, searchLength, sort, page, visibleCount, total])

  return null
}
