import NextImage from 'next/image'
import { cn } from '@/shared/utils'
import { GlassCard } from './GlassCard'
import {
  CARD_TITLE_SIZES,
  DETAIL_BODY_SIZES,
  DISPLAY_FONT_LABELS,
  DISPLAY_SIZE_LABELS,
  URGENCY_META,
  getAnnouncementTitleFontClass,
  type AnnouncementDisplayFont,
  type AnnouncementDisplaySize,
  type AnnouncementUrgency,
} from '@/modules/announcements/presentation'

type PreviewCategory = {
  name: string
  color: string | null
}

export function AnnouncementLivePreview({
  bannerUrl,
  urgency,
  isScheduled,
  isPinned,
  displayFont,
  displaySize,
  selectedCategory,
  title,
  body,
  registrationLink,
  urlError,
}: {
  bannerUrl: string
  urgency: AnnouncementUrgency
  isScheduled: boolean
  isPinned: boolean
  displayFont: AnnouncementDisplayFont
  displaySize: AnnouncementDisplaySize
  selectedCategory: PreviewCategory | undefined
  title: string
  body: string
  registrationLink: string
  urlError: string
}) {
  const selectedUrgency = URGENCY_META[urgency]
  const titleFontClass = getAnnouncementTitleFontClass(displayFont)

  return (
    <section className="announcement-preview-panel">
      <p className="mb-3 text-xs font-medium tracking-widest text-[var(--color-text-muted)] uppercase">
        Preview
      </p>
      <GlassCard hover={false} className="overflow-hidden">
        {bannerUrl && (
          <NextImage
            src={bannerUrl}
            alt="Preview banner"
            width={600}
            height={144}
            className="h-36 w-full object-contain"
            unoptimized
          />
        )}
        <div className="space-y-2 p-5">
          <div className="flex flex-wrap items-center gap-2">
            {urgency !== 'normal' && (
              <span
                className="rounded-md px-2.5 py-1 text-[15px] font-semibold"
                style={{
                  color: selectedUrgency.tone,
                  background: selectedUrgency.background,
                }}
              >
                {selectedUrgency.label}
              </span>
            )}
            {isScheduled && (
              <span className="rounded-md bg-[var(--color-accent-surface)] px-2.5 py-1 text-[15px] font-semibold text-[var(--color-accent-inti)]">
                Scheduled
              </span>
            )}
            {isPinned && (
              <span className="rounded-md bg-[var(--color-status-published-bg)] px-2.5 py-1 text-[15px] font-semibold text-[var(--color-status-published-text)]">
                Pinned
              </span>
            )}
            <span className="rounded-md bg-[var(--color-surface-elevated)] px-2.5 py-1 text-[15px] font-medium text-[var(--color-text-muted)]">
              {DISPLAY_FONT_LABELS[displayFont]} · {DISPLAY_SIZE_LABELS[displaySize]}
            </span>
          </div>
          {selectedCategory && (
            <div className="flex items-center gap-2">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: selectedCategory.color ?? 'var(--color-accent)' }}
              />
              <span className="text-[13.5px] font-medium tracking-[0.2em] text-[var(--color-text-muted)] uppercase">
                {selectedCategory.name}
              </span>
            </div>
          )}
          <h3
            className={cn(
              titleFontClass,
              'leading-tight font-semibold text-[var(--color-text-primary)]'
            )}
            style={{ fontSize: CARD_TITLE_SIZES[displaySize] }}
          >
            {title || 'Untitled Announcement'}
          </h3>
          <p
            className="line-clamp-3 leading-relaxed text-[var(--color-text-secondary)]"
            style={{ fontSize: DETAIL_BODY_SIZES[displaySize] }}
          >
            {body || 'Announcement body will appear here...'}
          </p>
          {registrationLink && !urlError && (
            <span className="inline-block text-[15px] font-medium tracking-wider text-[var(--color-accent)] uppercase">
              Register Here →
            </span>
          )}
        </div>
      </GlassCard>
    </section>
  )
}
