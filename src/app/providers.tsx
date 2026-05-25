'use client'

import { ThemeProvider } from 'next-themes'
import { IdleLogout } from '@/components/auth/IdleLogout'

export function Providers({ children, nonce }: { children: React.ReactNode; nonce?: string }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem nonce={nonce}>
      <IdleLogout />
      {children}
    </ThemeProvider>
  )
}
