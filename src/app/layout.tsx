import type { Metadata } from 'next'
import { Newsreader, Roboto } from 'next/font/google'
import './globals.css'

const newsreader = Newsreader({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
})

const roboto = Roboto({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
})

export const metadata: Metadata = {
  title: {
    default: 'Bulletin',
    template: '%s — Bulletin',
  },
  description: 'University announcements for INTI International University.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${newsreader.variable} ${roboto.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-[#FAFAFA] text-[#09090B]">{children}</body>
    </html>
  )
}
