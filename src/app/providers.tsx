'use client'

import { ThemeProvider } from 'next-themes'
import { IdleLogout } from '@/components/auth/IdleLogout'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <IdleLogout />
      {children}
    </ThemeProvider>
  )
}
