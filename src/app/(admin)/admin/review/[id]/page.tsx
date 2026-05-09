import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { GlassCard } from '@/components/dashboard/GlassCard'
import { StatusBadge } from '@/components/dashboard/StatusBadge'
import { getAnnouncementForReview } from '@/lib/data'
import { toSafeHttpUrl } from '@/lib/announcements/urls'
import { reviewAnnouncement } from './actions'

export const metadata = { title: 'Review Announcement — Bulletin Admin' }

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
    <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
      <Link
        href="/admin/review"
        className="flex min-h-11 w-fit items-center gap-1 text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
      >
        <ArrowLeft size={14} /> Back to queue
      </Link>

      {/* Announcement preview */}
      <GlassCard hover={false} className="overflow-hidden">
        {announcement.banner_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={announcement.banner_url} alt="" className="h-48 w-full object-contain" />
        )}
        <div className="space-y-4 p-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status="submitted" />
              {announcement.categories && (
                <span
                  className="inline-flex items-center rounded px-2 py-0.5 text-[15px] font-bold tracking-wider text-white uppercase"
                  style={{ background: announcement.categories.color ?? '#C8102E' }}
                >
                  {announcement.categories.name}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
              {announcement.title}
            </h1>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
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
              <p className="text-xs text-[var(--color-text-muted)]">{announcement.users?.email}</p>
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

          <div className="border-t border-[var(--color-border)] pt-4">
            <p className="leading-relaxed whitespace-pre-wrap text-[var(--color-text-secondary)]">
              {announcement.body}
            </p>
          </div>

          {registrationHref && (
            <a
              href={registrationHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-[var(--color-accent)] hover:underline"
            >
              Registration link <ExternalLink size={12} />
            </a>
          )}
        </div>
      </GlassCard>

      {/* Review form */}
      <GlassCard hover={false} className="space-y-4 p-6">
        <h2 className="font-semibold text-[var(--color-text-primary)]">Decision</h2>
        {error === 'rejection_comment_required' && (
          <div
            role="alert"
            className="rounded-lg border border-[var(--color-status-rejected-text)]/25 bg-[var(--color-status-rejected-bg)] px-4 py-3 text-sm text-[var(--color-status-rejected-text)]"
          >
            Add a rejection comment before sending changes back to the publisher.
          </div>
        )}
        <form action={review} className="space-y-4">
          <div>
            <label
              htmlFor="comment"
              className="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]"
            >
              Comment{' '}
              <span className="font-normal text-[var(--color-text-muted)]">
                (required for rejection)
              </span>
            </label>
            <textarea
              id="comment"
              name="comment"
              rows={3}
              placeholder="Optional note to the publisher..."
              className="input-inti w-full resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              name="_action"
              value="approve"
              className="min-h-11 flex-1 rounded-xl bg-[var(--color-status-published-bg)] text-sm font-semibold text-[var(--color-status-published-text)] transition-opacity hover:opacity-90"
            >
              Approve &amp; Publish
            </button>
            <button
              type="submit"
              name="_action"
              value="reject"
              className="min-h-11 flex-1 rounded-xl bg-[var(--color-status-rejected-bg)] text-sm font-semibold text-[var(--color-status-rejected-text)] transition-opacity hover:opacity-90"
            >
              Reject
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  )
}
