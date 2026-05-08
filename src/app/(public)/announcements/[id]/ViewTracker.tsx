'use client'

import { useEffect } from 'react'
import { recordAnnouncementView } from './actions'

export function ViewTracker({ announcementId }: { announcementId: string }) {
  useEffect(() => {
    const storageKey = `bulletin:viewed:${announcementId}`
    if (window.sessionStorage.getItem(storageKey)) return

    window.sessionStorage.setItem(storageKey, '1')
    void recordAnnouncementView(announcementId)
  }, [announcementId])

  return null
}
