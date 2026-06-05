'use client'

import { useEffect, useEffectEvent } from 'react'
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
  const reportPublicFeedView = useEffectEvent(
    (properties: {
      category: string
      has_search: boolean
      searchLength: number
      sort: string
      page: number
      visible_count: number
      total: number
    }) => {
      captureProductEvent('public_feed_viewed', properties)

      if (properties.searchLength > 0) {
        captureProductEvent('public_feed_searched', properties)
      }
    }
  )

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

    reportPublicFeedView(properties)
  }, [category, searchLength, sort, page, visibleCount, total])

  return null
}
