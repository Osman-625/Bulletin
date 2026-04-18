import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getAnnouncementById } from '@/lib/data'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const a = await getAnnouncementById(id)
  if (!a) return {}
  return { title: a.title }
}

export default async function AnnouncementPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const announcement = await getAnnouncementById(id)
  if (!announcement) notFound()

  const { title, body, banner_url, published_at, registration_link, categories, organizations } =
    announcement

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">

        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 font-sans text-[11px] font-medium tracking-[0.15em] uppercase text-[#71717A] hover:text-[#1B4332] transition-colors duration-200 mb-8 focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:ring-offset-1"
        >
          ← Back
        </Link>

        {/* Banner */}
        {banner_url && (
          <div className="relative aspect-[16/7] overflow-hidden bg-[#F4F4F5] mb-8">
            <Image src={banner_url} alt={title} fill className="object-cover" priority />
          </div>
        )}

        <article>
          {/* Meta dateline */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {categories && (
              <div className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: categories.color ?? '#71717A' }}
                  aria-hidden="true"
                />
                <span className="font-sans text-[9px] font-medium tracking-[0.2em] uppercase text-[#71717A]">
                  {categories.name}
                </span>
              </div>
            )}
            {organizations && (
              <span className="font-sans text-[9px] font-medium tracking-[0.15em] uppercase text-[#71717A]">
                {organizations.name}
              </span>
            )}
            {published_at && (
              <span className="font-sans text-[11px] text-[#A1A1AA]">
                {new Date(published_at).toLocaleDateString('en-MY', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            )}
          </div>

          {/* Title */}
          <h1
            className="font-display font-bold text-[#09090B] leading-[1.1] tracking-tight mb-4"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
          >
            {title}
          </h1>

          {/* Double rule */}
          <div className="h-[3px] bg-[#09090B] mb-0.5" />
          <div className="h-px bg-[#E4E4E7] mb-8" />

          {/* Body */}
          <p className="font-sans text-[15px] leading-[1.85] text-[#3F3F46] whitespace-pre-wrap"
             style={{ maxWidth: '65ch' }}>
            {body}
          </p>

          {/* Register CTA */}
          {registration_link && (
            <div className="mt-10 pt-8 border-t border-[#E4E4E7]">
              <a
                href={registration_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#1B4332] text-white font-sans text-[11px] font-medium tracking-[0.15em] uppercase px-8 py-3.5 hover:bg-[#14532D] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:ring-offset-2 cursor-pointer"
              >
                Register Here →
              </a>
            </div>
          )}
        </article>
      </main>
    </div>
  )
}
