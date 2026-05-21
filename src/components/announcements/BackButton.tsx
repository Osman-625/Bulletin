'use client'

import { BackNavButton } from '@/components/navigation/BackNavButton'

export default function BackButton() {
  return (
    <BackNavButton fallbackHref="/" className="mb-8 rounded-[10px] px-4 text-sm font-medium">
      Back
    </BackNavButton>
  )
}
