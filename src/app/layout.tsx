import type { Metadata } from 'next'
import { Atkinson_Hyperlegible, Bricolage_Grotesque, Geist_Mono } from 'next/font/google'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Providers } from './providers'
import { getCanonicalSiteUrl } from '@/lib/site'
import './globals.css'

const atkinsonHyperlegible = Atkinson_Hyperlegible({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
})

const geistMono = Geist_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  display: 'swap',
})

const bricolageGrotesque = Bricolage_Grotesque({
  variable: '--font-newsreader',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(getCanonicalSiteUrl()),
  title: {
    default: 'Bulletin',
    template: '%s — Bulletin',
  },
  description: 'Independent campus announcements for the INTI community.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${atkinsonHyperlegible.variable} ${geistMono.variable} ${bricolageGrotesque.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        <Providers>{children}</Providers>
        <SpeedInsights />
      </body>
    </html>
  )
}
