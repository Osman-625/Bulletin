import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { GlassCard } from '@/components/dashboard/GlassCard'
import { StatusBadge } from '@/components/dashboard/StatusBadge'
import { getAnnouncementForReview } from '@/lib/data'
import { reviewAnnouncement } from './actions'

export const metadata = { title: 'Review Announcement — Bulletin Admin' }

export default async function ReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const announcement = await getAnnouncementForReview(id)

  if (!announcement || announcement.status !== 'submitted') notFound()

  const review = reviewAnnouncement.bind(null, id)

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
      <Link href="/admin/review" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] flex items-center gap-1 transition-colors w-fit">
        <ArrowLeft size={14} /> Back to queue
      </Link>

      {/* Announcement preview */}
      <GlassCard hover={false} className="overflow-hidden">
        {announcement.banner_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={announcement.banner_url} alt="" className="w-full h-48 object-cover" />
        )}
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status="submitted" />
              {announcement.categories && (
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-white"
                  style={{ background: announcement.categories.color ?? '#C8102E' }}
                >
                  {announcement.categories.name}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">{announcement.title}</h1>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-[var(--color-text-muted)] text-xs uppercase tracking-wider mb-1">Organization</p>
              <p className="text-[var(--color-text-primary)] font-medium">{announcement.organizations?.name ?? '—'}</p>
            </div>
            <div>
              <p className="text-[var(--color-text-muted)] text-xs uppercase tracking-wider mb-1">Author</p>
              <p className="text-[var(--color-text-primary)] font-medium">{announcement.users?.display_name ?? '—'}</p>
              <p className="text-[var(--color-text-muted)] text-xs">{announcement.users?.email}</p>
            </div>
            <div>
              <p className="text-[var(--color-text-muted)] text-xs uppercase tracking-wider mb-1">Submitted</p>
              <p className="text-[var(--color-text-primary)] font-medium">
                {new Date(announcement.updated_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            {announcement.expires_at && (
              <div>
                <p className="text-[var(--color-text-muted)] text-xs uppercase tracking-wider mb-1">Expires</p>
                <p className="text-[var(--color-text-primary)] font-medium">
                  {new Date(announcement.expires_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-[var(--color-border)] pt-4">
            <p className="text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap">{announcement.body}</p>
          </div>

          {announcement.registration_link && (
            <a
              href={announcement.registration_link}
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
      <GlassCard hover={false} className="p-6 space-y-4">
        <h2 className="font-semibold text-[var(--color-text-primary)]">Decision</h2>
        <form action={review} className="space-y-4">
          <div>
            <label htmlFor="comment" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
              Comment <span className="text-[var(--color-text-muted)] font-normal">(required for rejection)</span>
            </label>
            <textarea
              id="comment"
              name="comment"
              rows={3}
              placeholder="Optional note to the publisher..."
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none input-inti resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              name="_action"
              value="approve"
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-[var(--color-status-published-bg)] text-[var(--color-status-published-text)] hover:opacity-90 transition-opacity"
            >
              Approve &amp; Publish
            </button>
            <button
              type="submit"
              name="_action"
              value="reject"
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-[var(--color-status-rejected-bg)] text-[var(--color-status-rejected-text)] hover:opacity-90 transition-opacity"
            >
              Reject
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  )
}
