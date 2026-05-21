'use client'

import { useEffect } from 'react'
import { captureProductEvent } from '@/lib/product-analytics'
import { recordAnnouncementView } from './actions'

export function ViewTracker({
  announcementId,
  categorySlug,
  organizationId,
  hasRegistrationLink,
}: {
  announcementId: string
  categorySlug?: string | null
  organizationId?: string | null
  hasRegistrationLink: boolean
}) {
  useEffect(() => {
    const storageKey = `bulletin:viewed:${announcementId}`
    if (window.sessionStorage.getItem(storageKey)) return

    window.sessionStorage.setItem(storageKey, '1')
    captureProductEvent('announcement_detail_viewed', {
      announcement_id: announcementId,
      category: categorySlug ?? null,
      organization_id: organizationId ?? null,
      has_registration_link: hasRegistrationLink,
    })
    void recordAnnouncementView(announcementId)
  }, [announcementId, categorySlug, organizationId, hasRegistrationLink])

  return null
}
