import { Suspense } from 'react'
import { getPublicAnnouncements, getActiveCategories } from '@/lib/data'
import AnnouncementCard from '@/components/announcements/AnnouncementCard'
import CategoryFilter from '@/components/announcements/CategoryFilter'

export const metadata = { title: 'Announcements' }

export default async function PublicFeedPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams

  const [announcements, categories] = await Promise.all([
    getPublicAnnouncements(category),
    getActiveCategories(),
  ])

  const today = new Date().toLocaleDateString('en-MY', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">

        {/* Editorial heading block */}
        <div className="mb-8">
          <div className="flex items-end justify-between mb-2 gap-4">
            <h1
              className="font-display font-bold text-[#09090B] leading-none tracking-tight"
              style={{ fontSize: 'clamp(2.5rem, 7vw, 5rem)' }}
            >
              Announcements
            </h1>
            <span className="hidden sm:block font-sans text-[11px] text-[#A1A1AA] tracking-wide pb-1 whitespace-nowrap">
              {today}
            </span>
          </div>
          <div className="h-[4px] bg-[#09090B]" />
          <div className="h-px bg-[#E4E4E7] mt-0.5" />
        </div>

        {/* Category filter */}
        <div className="mb-8">
          <Suspense fallback={<div className="h-8" />}>
            <CategoryFilter categories={categories} />
          </Suspense>
        </div>

        {/* Feed grid — newspaper gap trick */}
        {announcements.length === 0 ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
            <div className="h-px w-16 bg-[#E4E4E7]" />
            <p className="font-display text-2xl italic text-[#A1A1AA]">No announcements</p>
            <p className="font-sans text-sm text-[#A1A1AA]">
              {category ? 'Try a different category.' : 'Check back soon.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-px bg-[#E4E4E7] sm:grid-cols-2 lg:grid-cols-3">
            {announcements.map((a) => (
              <AnnouncementCard key={a.id} announcement={a} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
