import { notFound } from 'next/navigation'
import { ExternalLink } from 'lucide-react'
import { GlassCard } from '@/components/dashboard/GlassCard'
import { StatusBadge } from '@/components/dashboard/StatusBadge'
import { BackNavButton } from '@/components/navigation/BackNavButton'
import { getAnnouncementForReview } from '@/lib/data'
import { toSafeHttpUrl } from '@/lib/announcements/urls'
import { DEFAULT_CATEGORY_DISPLAY_COLOR } from '@/lib/categories/display'
import { reviewAnnouncement } from './actions'

export const metadata = { title: 'Review Announcement' }

export default async function ReviewDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const { error } = await searchParams
  const announcement = await getAnnouncementForReview(id)

  if (!announcement || announcement.status !== 'submitted') notFound()

  const review = reviewAnnouncement.bind(null, id)
  const registrationHref = toSafeHttpUrl(announcement.registration_link)

  return (
    <div className="dashboard-page mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">
      <BackNavButton
        fallbackHref="/admin/review"
        className="inline-flex min-h-11 w-fit items-center gap-2 rounded-[0.9rem] px-3 text-sm font-semibold text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)]"
      >
        Back to queue
      </BackNavButton>

      <div className="grid gap-3 lg:grid-cols-12">
        <GlassCard hover={false} className="dashboard-command-card overflow-hidden lg:col-span-7">
          {announcement.banner_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={announcement.banner_url}
              alt={announcement.title}
              className="h-64 w-full bg-[var(--color-surface-elevated)] object-contain"
            />
          )}
          <div className="space-y-5 p-5 sm:p-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status="submitted" />
                {announcement.categories && (
                  <span
                    className="inline-flex items-center rounded-[0.45rem] px-2 py-1 font-mono text-[0.68rem] font-bold tracking-[0.12em] text-white uppercase"
                    style={{
                      background: announcement.categories.color ?? DEFAULT_CATEGORY_DISPLAY_COLOR,
                    }}
                  >
                    {announcement.categories.name}
                  </span>
                )}
              </div>
              <h1 className="font-display text-3xl leading-none font-extrabold text-[var(--color-text-primary)] sm:text-4xl">
                {announcement.title}
              </h1>
            </div>

            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="mb-1 text-xs tracking-wider text-[var(--color-text-muted)] uppercase">
                  Organization
                </p>
                <p className="font-medium text-[var(--color-text-primary)]">
                  {announcement.organizations?.name ?? '—'}
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs tracking-wider text-[var(--color-text-muted)] uppercase">
                  Author
                </p>
                <p className="font-medium text-[var(--color-text-primary)]">
                  {announcement.users?.display_name ?? '—'}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {announcement.users?.email}
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs tracking-wider text-[var(--color-text-muted)] uppercase">
                  Submitted
                </p>
                <p className="font-medium text-[var(--color-text-primary)]">
                  {new Date(announcement.updated_at).toLocaleDateString('en-MY', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
              {announcement.scheduled_publish_at && (
                <div>
                  <p className="mb-1 text-xs tracking-wider text-[var(--color-text-muted)] uppercase">
                    Scheduled
                  </p>
                  <p className="font-medium text-[var(--color-text-primary)]">
                    {new Date(announcement.scheduled_publish_at).toLocaleString('en-MY', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              )}
              {announcement.pinned_until && (
                <div>
                  <p className="mb-1 text-xs tracking-wider text-[var(--color-text-muted)] uppercase">
                    Pinned Until
                  </p>
                  <p className="font-medium text-[var(--color-text-primary)]">
                    {new Date(announcement.pinned_until).toLocaleString('en-MY', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              )}
              {announcement.expires_at && (
                <div>
                  <p className="mb-1 text-xs tracking-wider text-[var(--color-text-muted)] uppercase">
                    Expires
                  </p>
                  <p className="font-medium text-[var(--color-text-primary)]">
                    {new Date(announcement.expires_at).toLocaleDateString('en-MY', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-[var(--color-border)] pt-5">
              <p className="leading-7 whitespace-pre-wrap text-[var(--color-text-secondary)]">
                {announcement.body}
              </p>
            </div>

            {registrationHref && (
              <a
                href={registrationHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-1.5 rounded-[0.9rem] px-3 text-sm font-semibold text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent-surface)]"
              >
                Registration link <ExternalLink size={12} />
              </a>
            )}
          </div>
        </GlassCard>

        <GlassCard
          hover={false}
          className="dashboard-command-card h-fit space-y-5 p-5 sm:p-6 lg:col-span-5"
        >
          <div>
            <p className="future-kicker">Publishing decision</p>
            <h2 className="mt-3 text-2xl font-bold text-[var(--color-text-primary)]">
              Approve or return changes
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
              Add a note when the publisher needs to adjust wording, category, dates, or poster
              details.
            </p>
          </div>
          {error === 'rejection_comment_required' && (
            <div
              role="alert"
              className="rounded-[1rem] border border-[var(--color-status-rejected-text)]/25 bg-[var(--color-status-rejected-bg)] px-4 py-3 text-sm text-[var(--color-status-rejected-text)]"
            >
              Add feedback before returning this to the publisher.
            </div>
          )}
          {error === 'review_failed' && (
            <div
              role="alert"
              className="rounded-[1rem] border border-[var(--color-status-rejected-text)]/25 bg-[var(--color-status-rejected-bg)] px-4 py-3 text-sm text-[var(--color-status-rejected-text)]"
            >
              Could not save the review decision. Try again.
            </div>
          )}
          <form action={review} className="space-y-4">
            <div>
              <label
                htmlFor="comment"
                className="mb-2 block text-sm font-semibold text-[var(--color-text-secondary)]"
              >
                Comment{' '}
                <span className="font-normal text-[var(--color-text-muted)]">
                  (required when returning)
                </span>
              </label>
              <textarea
                id="comment"
                name="comment"
                rows={5}
                placeholder="Write a clear note for the publisher."
                className="input-inti w-full resize-none rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <button
                type="submit"
                name="_action"
                value="approve"
                className="action-lift min-h-11 rounded-[0.95rem] bg-[var(--color-status-published-bg)] px-4 text-sm font-semibold text-[var(--color-status-published-text)]"
              >
                Approve and publish
              </button>
              <button
                type="submit"
                name="_action"
                value="reject"
                className="action-lift min-h-11 rounded-[0.95rem] bg-[var(--color-status-rejected-bg)] px-4 text-sm font-semibold text-[var(--color-status-rejected-text)]"
              >
                Return changes
              </button>
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  )
}
