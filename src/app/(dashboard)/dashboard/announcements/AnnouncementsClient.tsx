'use client'

import { useMemo, useState, type ChangeEvent, type ComponentType } from 'react'
import { Archive, CheckCircle2, FileText, PenLine, Search } from 'lucide-react'
import { AnnouncementRow } from '@/components/dashboard/AnnouncementRow'
import type { AnnouncementRowData } from '@/components/dashboard/AnnouncementRow'
import { cn } from '@/lib/utils'

type Tab = 'all' | 'published' | 'drafts' | 'pending' | 'archived'

const TABS: { id: Tab; label: string; icon: ComponentType<{ size?: number }> }[] = [
  { id: 'all', label: 'All', icon: FileText },
  { id: 'published', label: 'Live', icon: CheckCircle2 },
  { id: 'drafts', label: 'Drafts', icon: PenLine },
  { id: 'pending', label: 'In review', icon: FileText },
  { id: 'archived', label: 'Archive', icon: Archive },
]

const PAGE_SIZE = 10

interface AnnouncementsClientProps {
  announcements: AnnouncementRowData[]
  initialQuery?: string
}

function EmptyState({ tab, query }: { tab: Tab; query: string }) {
  const messages: Record<Tab, { title: string; body: string }> = {
    all: {
      title: 'No announcements yet',
      body: 'Create the first announcement for this workspace.',
    },
    published: { title: 'Nothing live yet', body: 'Published announcements will collect here.' },
    drafts: { title: 'No drafts', body: 'Saved drafts will appear here before review.' },
    pending: {
      title: 'Nothing in review',
      body: 'Announcements waiting for admin review or returned with feedback will appear here.',
    },
    archived: {
      title: 'Nothing archived',
      body: 'Expired and archived announcements will appear here.',
    },
  }
  const { title, body } = messages[tab]

  return (
    <div className="rounded-[1.2rem] border border-dashed border-[var(--color-border)] px-5 py-16 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[1rem] bg-[var(--color-accent-surface)] text-[var(--color-accent)]">
        <FileText size={20} aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-[var(--color-text-primary)]">
        {query.trim() ? 'No matching announcements' : title}
      </h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--color-text-muted)]">
        {query.trim()
          ? `Nothing matched "${query.trim()}". Try a title, topic, or organization.`
          : body}
      </p>
    </div>
  )
}

export function AnnouncementsClient({
  announcements,
  initialQuery = '',
}: AnnouncementsClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('all')
  const [query, setQuery] = useState(initialQuery)
  const [page, setPage] = useState(1)
  const [animKey, setAnimKey] = useState(0)

  const counts = useMemo(
    () => ({
      all: announcements.length,
      published: announcements.filter((a) => a.status === 'published').length,
      drafts: announcements.filter((a) => a.status === 'draft').length,
      pending: announcements.filter((a) => a.status === 'submitted' || a.status === 'rejected')
        .length,
      archived: announcements.filter((a) => a.status === 'archived' || a.status === 'expired')
        .length,
    }),
    [announcements]
  )

  const filtered = useMemo(() => {
    let items = announcements

    if (activeTab === 'published') {
      items = items.filter((a) => a.status === 'published')
    } else if (activeTab === 'drafts') {
      items = items.filter((a) => a.status === 'draft')
    } else if (activeTab === 'pending') {
      items = items.filter((a) => a.status === 'submitted' || a.status === 'rejected')
    } else if (activeTab === 'archived') {
      items = items.filter((a) => a.status === 'archived' || a.status === 'expired')
    }

    if (query.trim()) {
      const normalizedQuery = query.toLowerCase()
      items = items.filter(
        (a) =>
          a.title.toLowerCase().includes(normalizedQuery) ||
          a.categories?.name.toLowerCase().includes(normalizedQuery) ||
          a.organizations?.name.toLowerCase().includes(normalizedQuery) ||
          a.rejection_comment?.toLowerCase().includes(normalizedQuery)
      )
    }

    return items
  }, [announcements, activeTab, query])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const clampedPage = Math.min(page, totalPages)
  const startIdx = (clampedPage - 1) * PAGE_SIZE
  const endIdx = Math.min(startIdx + PAGE_SIZE, filtered.length)
  const pageItems = filtered.slice(startIdx, endIdx)

  function changeTab(tab: Tab) {
    setActiveTab(tab)
    setPage(1)
    setAnimKey((key) => key + 1)
  }

  function handleSearch(e: ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value)
    setPage(1)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex [scrollbar-width:none] gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => changeTab(tab.id)}
                aria-pressed={active}
                className={cn(
                  'tab-lift inline-flex min-h-11 shrink-0 items-center gap-2 rounded-[0.95rem] border px-3 text-sm font-semibold',
                  active
                    ? 'border-[color-mix(in_oklab,var(--color-accent-inti)_24%,var(--color-border))] bg-[var(--color-accent-surface)] text-[var(--color-accent)]'
                    : 'border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-surface)_74%,transparent)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                )}
              >
                <Icon size={14} />
                {tab.label}
                <span className="rounded-full bg-[color-mix(in_oklab,var(--color-surface-high)_54%,transparent)] px-1.5 py-0.5 font-mono text-[0.68rem] text-[var(--color-text-muted)]">
                  {counts[tab.id]}
                </span>
              </button>
            )
          })}
        </div>

        <label className="relative block w-full lg:w-[22rem]">
          <span className="sr-only">Search announcements</span>
          <Search
            size={16}
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[var(--color-text-muted)]"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={handleSearch}
            placeholder="Search title, topic, organization"
            className={cn(
              'input-inti min-h-11 w-full rounded-[0.95rem] border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-surface)_78%,transparent)] pr-4 pl-10 text-sm',
              'text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]',
              'transition-[border-color,box-shadow,background] duration-200'
            )}
          />
        </label>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-[var(--color-border-subtle)] pt-4">
        <p className="text-sm text-[var(--color-text-muted)]">
          <span className="font-semibold text-[var(--color-text-primary)]">{filtered.length}</span>{' '}
          result{filtered.length === 1 ? '' : 's'} in this view
        </p>
        {query.trim() && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="min-h-9 rounded-[0.8rem] px-3 text-sm font-semibold text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent-surface)]"
          >
            Clear search
          </button>
        )}
      </div>

      {pageItems.length === 0 ? (
        <EmptyState tab={activeTab} query={query} />
      ) : (
        <div className="space-y-3" key={animKey}>
          {pageItems.map((announcement, index) => (
            <AnnouncementRow
              key={announcement.id}
              announcement={announcement}
              style={{
                animation: `fade-up 420ms cubic-bezier(0.16,1,0.3,1) both`,
                animationDelay: `${index * 45}ms`,
              }}
            />
          ))}
        </div>
      )}

      {filtered.length > PAGE_SIZE && (
        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[var(--color-text-muted)]">
            Showing{' '}
            <span className="font-semibold text-[var(--color-text-primary)]">{startIdx + 1}</span>{' '}
            to <span className="font-semibold text-[var(--color-text-primary)]">{endIdx}</span> of{' '}
            <span className="font-semibold text-[var(--color-text-primary)]">
              {filtered.length}
            </span>
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((paginationPage) => (
              <button
                key={paginationPage}
                type="button"
                onClick={() => setPage(paginationPage)}
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-[0.85rem] border font-mono text-sm font-semibold transition-[transform,background,border-color,color] duration-200 active:scale-[0.98]',
                  paginationPage === clampedPage
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white'
                    : 'border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-surface)_72%,transparent)] text-[var(--color-text-muted)] hover:-translate-y-px hover:border-[var(--color-accent)] hover:text-[var(--color-text-primary)]'
                )}
              >
                {paginationPage}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
