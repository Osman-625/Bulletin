'use client'

import type { CSSProperties } from 'react'
import { captureProductEvent } from '@/shared/constants/product-analytics'

export function RegistrationLink({
  href,
  announcementId,
  className,
  style,
  children,
}: {
  href: string
  announcementId: string
  className?: string
  style?: CSSProperties
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      style={style}
      onClick={() =>
        captureProductEvent('announcement_registration_clicked', {
          announcement_id: announcementId,
        })
      }
    >
      {children}
    </a>
  )
}
