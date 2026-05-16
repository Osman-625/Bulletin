import type { Metadata } from 'next'
import {
  Archivo_Narrow,
  Atkinson_Hyperlegible,
  Bricolage_Grotesque,
  Faculty_Glyphic,
  Geist_Mono,
  Literata,
} from 'next/font/google'
import { BrandLabView } from './BrandLabView'
import {
  brandDirections,
  brandLabResearchAnchors,
  isBrandDirectionSlug,
  selectedBrandDirection,
} from '@/lib/brand-lab/directions'

const pressDisplay = Literata({
  variable: '--font-brand-press-display',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

const atlasDisplay = Archivo_Narrow({
  variable: '--font-brand-atlas-display',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

const commonsDisplay = Bricolage_Grotesque({
  variable: '--font-brand-commons-display',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

const body = Atkinson_Hyperlegible({
  variable: '--font-brand-body',
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
})

const mono = Geist_Mono({
  variable: '--font-brand-mono',
  subsets: ['latin'],
  display: 'swap',
})

const commonsLabel = Faculty_Glyphic({
  variable: '--font-brand-commons-label',
  subsets: ['latin'],
  weight: ['400'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Brand Lab',
  description: 'INTI-inspired brand directions and design-system mockups for Bulletin.',
}

export default async function BrandLabPage({
  searchParams,
}: {
  searchParams: Promise<{ direction?: string }>
}) {
  const params = await searchParams
  const activeSlug = isBrandDirectionSlug(params.direction)
    ? params.direction
    : selectedBrandDirection.slug

  return (
    <div
      className={`${pressDisplay.variable} ${atlasDisplay.variable} ${commonsDisplay.variable} ${body.variable} ${mono.variable} ${commonsLabel.variable}`}
    >
      <BrandLabView
        directions={brandDirections}
        activeSlug={activeSlug}
        researchAnchors={brandLabResearchAnchors}
      />
    </div>
  )
}
