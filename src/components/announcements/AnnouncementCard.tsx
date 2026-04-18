import Link from 'next/link'
import Image from 'next/image'
import type { AnnouncementWithRelations } from '@/lib/types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-MY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function AnnouncementCard({ announcement }: { announcement: AnnouncementWithRelations }) {
  const { id, title, body, banner_url, published_at, registration_link, categories, organizations } =
    announcement

  return (
    <Link
      href={`/announcements/${id}`}
      className="group flex flex-col bg-white cursor-pointer outline-none focus:ring-2 focus:ring-[#1B4332] focus:ring-inset border-l-[3px] border-l-transparent hover:border-l-[#1B4332] transition-all duration-200"
      style={{ contain: 'layout' }}
    >
      {/* Banner */}
      {banner_url && (
        <div className="relative h-44 overflow-hidden bg-[#F4F4F5]">
          <Image
            src={banner_url}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
      )}

      <div className="flex flex-1 flex-col p-5 gap-3">
        {/* Category */}
        {categories && (
          <div className="flex items-center gap-2">
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

        {/* Title */}
        <h2 className="font-display text-[20px] font-semibold leading-[1.2] text-[#09090B] group-hover:text-[#1B4332] transition-colors duration-200">
          {title}
        </h2>

        {/* Excerpt */}
        <p className="font-sans text-[13px] leading-relaxed text-[#71717A] line-clamp-2 flex-1">
          {body}
        </p>

        {/* Footer */}
        <div className="pt-3 border-t border-[#E4E4E7] flex items-center justify-between gap-2">
          <span className="font-sans text-[11px] text-[#71717A] truncate">
            {organizations?.name}
          </span>
          {published_at && (
            <span className="font-sans text-[11px] text-[#A1A1AA] flex-shrink-0">
              {formatDate(published_at)}
            </span>
          )}
        </div>

        {registration_link && (
          <span className="font-sans text-[10px] font-medium tracking-[0.12em] uppercase text-[#1B4332]">
            Register Here →
          </span>
        )}
      </div>
    </Link>
  )
}
