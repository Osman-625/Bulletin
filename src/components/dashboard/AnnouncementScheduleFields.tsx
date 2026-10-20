import { Calendar, Clock, Pin } from 'lucide-react'
import { cn } from '@/shared/utils'

export function AnnouncementScheduleFields({
  scheduledPublishAt,
  scheduledPublishError,
  onScheduledPublishAtChange,
  pinnedUntil,
  pinnedUntilError,
  onPinnedUntilChange,
  expiresAt,
  expiresAtError,
  onExpiresAtChange,
}: {
  scheduledPublishAt: string
  scheduledPublishError: string
  onScheduledPublishAtChange: (value: string) => void
  pinnedUntil: string
  pinnedUntilError: string
  onPinnedUntilChange: (value: string) => void
  expiresAt: string
  expiresAtError: string
  onExpiresAtChange: (value: string) => void
}) {
  return (
    <>
      {/* Publishing Controls */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        <div>
          <label
            htmlFor="scheduled-publish-at"
            className="mb-1 block text-xs font-medium tracking-widest text-[var(--color-text-muted)] uppercase"
          >
            Schedule for later <span className="tracking-normal normal-case">(optional)</span>
          </label>
          <div className="relative">
            <Clock
              size={16}
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--color-text-muted)]"
            />
            <input
              id="scheduled-publish-at"
              type="datetime-local"
              value={scheduledPublishAt}
              onChange={(e) => onScheduledPublishAtChange(e.target.value)}
              aria-invalid={Boolean(scheduledPublishError)}
              aria-describedby={
                scheduledPublishError
                  ? 'scheduled-publish-at-error scheduled-publish-at-help'
                  : 'scheduled-publish-at-help'
              }
              className={cn(
                'w-full rounded-xl py-3 pr-4 pl-9 text-sm',
                'bg-transparent text-[var(--color-text-primary)]',
                'border',
                scheduledPublishError
                  ? 'border-[var(--color-destructive)] focus:ring-[var(--color-destructive)]/30'
                  : 'border-[var(--color-glass-border)] focus:border-[var(--color-accent)] focus:ring-[var(--color-accent)]/30',
                'focus:ring-2 focus:outline-none',
                'transition-all duration-200'
              )}
            />
          </div>
          {scheduledPublishError && (
            <p
              id="scheduled-publish-at-error"
              className="mt-1.5 text-xs text-[var(--color-destructive)]"
            >
              {scheduledPublishError}
            </p>
          )}
          <p
            id="scheduled-publish-at-help"
            className="mt-1.5 text-xs text-[var(--color-text-muted)]"
          >
            Leave blank to go live right after approval.
          </p>
        </div>

        <div>
          <label
            htmlFor="pinned-until"
            className="mb-1 block text-xs font-medium tracking-widest text-[var(--color-text-muted)] uppercase"
          >
            Pin Until <span className="tracking-normal normal-case">(optional)</span>
          </label>
          <div className="relative">
            <Pin
              size={16}
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--color-text-muted)]"
            />
            <input
              id="pinned-until"
              type="datetime-local"
              value={pinnedUntil}
              onChange={(e) => onPinnedUntilChange(e.target.value)}
              aria-invalid={Boolean(pinnedUntilError)}
              aria-describedby={
                pinnedUntilError ? 'pinned-until-error pinned-until-help' : 'pinned-until-help'
              }
              className={cn(
                'w-full rounded-xl py-3 pr-4 pl-9 text-sm',
                'bg-transparent text-[var(--color-text-primary)]',
                'border',
                pinnedUntilError
                  ? 'border-[var(--color-destructive)] focus:ring-[var(--color-destructive)]/30'
                  : 'border-[var(--color-glass-border)] focus:border-[var(--color-accent)] focus:ring-[var(--color-accent)]/30',
                'focus:ring-2 focus:outline-none',
                'transition-all duration-200'
              )}
            />
          </div>
          {pinnedUntilError && (
            <p id="pinned-until-error" className="mt-1.5 text-xs text-[var(--color-destructive)]">
              {pinnedUntilError}
            </p>
          )}
          <p id="pinned-until-help" className="mt-1.5 text-xs text-[var(--color-text-muted)]">
            Pinned posts stay first on the public board.
          </p>
        </div>
      </div>

      {/* Expires At */}
      <div>
        <label
          htmlFor="expires-at"
          className="mb-1 block text-xs font-medium tracking-widest text-[var(--color-text-muted)] uppercase"
        >
          Expiry Date <span className="tracking-normal normal-case">(optional)</span>
        </label>
        <div className="relative">
          <Calendar
            size={16}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--color-text-muted)]"
          />
          <input
            id="expires-at"
            type="date"
            value={expiresAt}
            onChange={(e) => onExpiresAtChange(e.target.value)}
            aria-invalid={Boolean(expiresAtError)}
            aria-describedby={expiresAtError ? 'expires-at-error' : undefined}
            className={cn(
              'w-full rounded-xl py-3 pr-4 pl-9 text-sm',
              'bg-transparent text-[var(--color-text-primary)]',
              'border',
              expiresAtError
                ? 'border-[var(--color-destructive)] focus:ring-[var(--color-destructive)]/30'
                : 'border-[var(--color-glass-border)] focus:border-[var(--color-accent)] focus:ring-[var(--color-accent)]/30',
              'focus:ring-2 focus:outline-none',
              'transition-all duration-200'
            )}
          />
        </div>
        {expiresAtError && (
          <p
            id="expires-at-error"
            role="alert"
            className="mt-1.5 text-xs text-[var(--color-destructive)]"
          >
            {expiresAtError}
          </p>
        )}
      </div>
    </>
  )
}
