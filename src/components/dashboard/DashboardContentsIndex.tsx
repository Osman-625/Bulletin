'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { formatCampusCompactDate } from '@/lib/announcements/public-board'

export type DashboardIndexAnnouncement = {
  id: string
  title: string
  status: string
  view_count: number
  updated_at: string
  categories: { name: string; color: string | null } | null
}

const STATUS_DISPLAY: Record<string, { label: string; className: string }> = {
  published: {
    label: 'Published',
    className: 'tone-published',
  },
  submitted: {
    label: 'In review',
    className: 'tone-submitted',
  },
  draft: {
    label: 'Draft',
    className: 'tone-draft',
  },
  expired: {
    label: 'Expired',
    className: 'tone-expired',
  },
  archived: {
    label: 'Archived',
    className: 'tone-archived',
  },
  rejected: {
    label: 'Rejected',
    className: 'tone-rejected',
  },
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'published', label: 'Published' },
  { key: 'submitted', label: 'In review' },
  { key: 'draft', label: 'Drafts' },
  { key: 'expired', label: 'Expired' },
] as const

function formatUpdated(iso: string) {
  return formatCampusCompactDate(iso)
}

export function DashboardContentsIndex({
  announcements,
}: {
  announcements: DashboardIndexAnnouncement[]
}) {
  const [filter, setFilter] = useState<string>('all')

  const items = filter === 'all' ? announcements : announcements.filter((a) => a.status === filter)

  const st = STATUS_DISPLAY

  return (
    <section className="pub-index">
      <div className="pub-index-head">
        <h2 className="pub-index-title">
          Your desk{' '}
          <span className="count">
            {items.length} notice{items.length === 1 ? '' : 's'}
          </span>
        </h2>
        <div className="pub-filter" role="tablist" aria-label="Filter announcements">
          {FILTERS.map(({ key, label }) => (
            <button
              type="button"
              key={key}
              role="tab"
              aria-selected={filter === key}
              className={filter === key ? 'on' : ''}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <p className="pub-index-empty">No notices match this filter.</p>
      ) : (
        <div>
          {items.map((a, i) => {
            const status = st[a.status] ?? st.draft
            const catColor = a.categories?.color ?? 'var(--color-text-muted)'
            return (
              <Link key={a.id} href={`/dashboard/announcements/${a.id}/edit`} className="pub-entry">
                <span className="pub-entry-no">{String(i + 1).padStart(2, '0')}</span>
                <div className="pub-entry-main">
                  <p className="pub-entry-title">{a.title}</p>
                  <div className="pub-entry-meta">
                    {a.categories && (
                      <span className="pub-entry-cat">
                        <span
                          className="pub-dot"
                          style={{
                            backgroundColor: catColor,
                          }}
                          aria-hidden="true"
                        />
                        {a.categories.name}
                      </span>
                    )}
                    <span className="pub-entry-when">Updated {formatUpdated(a.updated_at)}</span>
                  </div>
                </div>
                <span className={`pub-entry-status ${status.className}`}>{status.label}</span>
                <div className="pub-entry-views">
                  {a.view_count > 0 ? a.view_count.toLocaleString('en-MY') : '—'}
                  <span>views</span>
                </div>
                <ChevronRight size={16} className="pub-chev" aria-hidden="true" />
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}
