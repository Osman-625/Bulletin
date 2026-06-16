import type { Metadata } from 'next'
import { Atkinson_Hyperlegible, Bricolage_Grotesque, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { headers } from 'next/headers'
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
  openGraph: {
    title: 'Bulletin',
    description: 'Independent campus announcements for the INTI community.',
    url: '/',
    siteName: 'Bulletin',
    images: [
      {
        url: '/bulletin_logo.png',
        width: 512,
        height: 512,
        alt: 'Bulletin campus announcements',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Bulletin',
    description: 'Independent campus announcements for the INTI community.',
    images: ['/bulletin_logo.png'],
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const requestHeaders = await headers()
  const nonce = requestHeaders.get('x-nonce') ?? undefined

  return (
    <html
      lang="en"
      className={`${atkinsonHyperlegible.variable} ${geistMono.variable} ${bricolageGrotesque.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <a
          href="#main-content"
          className="sr-only z-[60] rounded-full bg-[var(--color-accent-inti)] px-4 py-3 text-sm font-bold text-white shadow-[var(--shadow-button-hover)] focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:flex focus:min-h-11 focus:items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-inti)]"
        >
          Skip to content
        </a>
        <Providers nonce={nonce}>{children}</Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
