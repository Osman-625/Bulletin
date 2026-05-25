'use client'

import Link from 'next/link'
import { type ComponentType } from 'react'
import { Archive, CheckCircle2, FileText, PenLine, Search } from 'lucide-react'
import { AnnouncementRow } from '@/components/dashboard/AnnouncementRow'
import type { AnnouncementRowData } from '@/components/dashboard/AnnouncementRow'
import { cn } from '@/lib/utils'

export type AnnouncementTab = 'all' | 'published' | 'drafts' | 'pending' | 'archived'
export type AnnouncementTabCounts = Record<AnnouncementTab, number>

const TABS: { id: AnnouncementTab; label: string; icon: ComponentType<{ size?: number }> }[] = [
  { id: 'all', label: 'All', icon: FileText },
  { id: 'published', label: 'Live', icon: CheckCircle2 },
  { id: 'drafts', label: 'Drafts', icon: PenLine },
  { id: 'pending', label: 'In review', icon: FileText },
  { id: 'archived', label: 'Archive', icon: Archive },
]

interface AnnouncementsClientProps {
  announcements: AnnouncementRowData[]
  activeTab: AnnouncementTab
  search: string
  page: number
  pageSize: number
  totalPages: number
  totalResults: number
  tabCounts: AnnouncementTabCounts
  nowMs: number
}

function EmptyState({ tab, query }: { tab: AnnouncementTab; query: string }) {
  const messages: Record<AnnouncementTab, { title: string; body: string }> = {
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
        {query.trim() ? `Nothing matched "${query.trim()}". Try a broader search.` : body}
      </p>
    </div>
  )
}

function dashboardAnnouncementsHref({
  tab,
  search,
  page,
}: {
  tab?: AnnouncementTab
  search?: string
  page?: number
}) {
  const params = new URLSearchParams()
  if (tab && tab !== 'all') params.set('tab', tab)
  if (search) params.set('search', search)
  if (page && page > 1) params.set('page', String(page))
  const query = params.toString()
  return query ? `/dashboard/announcements?${query}` : '/dashboard/announcements'
}

function visiblePaginationPages(page: number, totalPages: number) {
  const windowSize = 5
  const start = Math.max(1, Math.min(page - 2, totalPages - windowSize + 1))
  const end = Math.min(totalPages, start + windowSize - 1)
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
}

export function AnnouncementsClient({
  announcements,
  activeTab,
  search,
  page,
  pageSize,
  totalPages,
  totalResults,
  tabCounts,
  nowMs,
}: AnnouncementsClientProps) {
  const startIdx = announcements.length > 0 ? (page - 1) * pageSize + 1 : 0
  const endIdx =
    announcements.length > 0 ? Math.min(startIdx + announcements.length - 1, totalResults) : 0
  const paginationPages = visiblePaginationPages(page, totalPages)

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id

            return (
              <Link
                key={tab.id}
                href={dashboardAnnouncementsHref({ tab: tab.id, search })}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'tab-lift inline-flex min-h-11 shrink-0 items-center gap-2 rounded-[0.95rem] border px-3 text-sm font-semibold',
                  active
                    ? 'border-[color-mix(in_oklab,var(--color-accent-inti)_24%,var(--color-border))] bg-[var(--color-accent-surface)] text-[var(--color-accent)]'
                    : 'border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-surface)_74%,transparent)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                )}
              >
                <Icon size={14} aria-hidden="true" />
                {tab.label}
                <span className="rounded-full bg-[color-mix(in_oklab,var(--color-surface-high)_54%,transparent)] px-1.5 py-0.5 font-mono text-[0.68rem] text-[var(--color-text-muted)]">
                  {tabCounts[tab.id]}
                </span>
              </Link>
            )
          })}
        </div>

        <form
          action="/dashboard/announcements"
          className="grid w-full gap-2 sm:grid-cols-[minmax(0,1fr)_auto] xl:w-[32rem]"
        >
          {activeTab !== 'all' && <input type="hidden" name="tab" value={activeTab} />}
          <label className="relative block min-w-0">
            <span className="sr-only">Search announcements</span>
            <Search
              size={16}
              className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[var(--color-text-muted)]"
              aria-hidden="true"
            />
            <input
              type="search"
              name="search"
              defaultValue={search}
              placeholder="Search title or feedback"
              className={cn(
                'input-inti min-h-11 w-full rounded-[0.95rem] border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-surface)_78%,transparent)] pr-4 pl-10 text-sm',
                'text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]',
                'transition-[border-color,box-shadow,background] duration-200'
              )}
            />
          </label>
          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center rounded-[0.95rem] bg-[var(--color-accent)] px-4 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 active:translate-y-0"
          >
            Search
          </button>
        </form>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-[var(--color-border-subtle)] pt-4">
        <p className="text-sm text-[var(--color-text-muted)]">
          <span className="font-semibold text-[var(--color-text-primary)]">{totalResults}</span>{' '}
          result{totalResults === 1 ? '' : 's'} in this view
        </p>
        {search.trim() && (
          <Link
            href={dashboardAnnouncementsHref({ tab: activeTab })}
            className="min-h-9 rounded-[0.8rem] px-3 py-2 text-sm font-semibold text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent-surface)]"
          >
            Clear search
          </Link>
        )}
      </div>

      {announcements.length === 0 ? (
        <EmptyState tab={activeTab} query={search} />
      ) : (
        <div className="space-y-3">
          {announcements.map((announcement, index) => (
            <AnnouncementRow
              key={announcement.id}
              announcement={announcement}
              nowMs={nowMs}
              style={{
                animation: `fade-up 420ms cubic-bezier(0.16,1,0.3,1) both`,
                animationDelay: `${index * 45}ms`,
              }}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav
          className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between"
          aria-label="Announcement pagination"
        >
          <p className="text-sm text-[var(--color-text-muted)]">
            Showing{' '}
            <span className="font-semibold text-[var(--color-text-primary)]">{startIdx}</span> to{' '}
            <span className="font-semibold text-[var(--color-text-primary)]">{endIdx}</span> of{' '}
            <span className="font-semibold text-[var(--color-text-primary)]">{totalResults}</span>
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            {page > 1 && (
              <Link
                href={dashboardAnnouncementsHref({ tab: activeTab, search, page: page - 1 })}
                className="flex h-10 items-center justify-center rounded-[0.85rem] border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-surface)_72%,transparent)] px-3 text-sm font-semibold text-[var(--color-text-muted)] transition-[transform,background,border-color,color] duration-200 hover:-translate-y-px hover:border-[var(--color-accent)] hover:text-[var(--color-text-primary)] active:scale-[0.98]"
              >
                Previous
              </Link>
            )}
            {paginationPages.map((paginationPage) => {
              const active = paginationPage === page

              return (
                <Link
                  key={paginationPage}
                  href={dashboardAnnouncementsHref({
                    tab: activeTab,
                    search,
                    page: paginationPage,
                  })}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-[0.85rem] border font-mono text-sm font-semibold transition-[transform,background,border-color,color] duration-200 active:scale-[0.98]',
                    active
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white'
                      : 'border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-surface)_72%,transparent)] text-[var(--color-text-muted)] hover:-translate-y-px hover:border-[var(--color-accent)] hover:text-[var(--color-text-primary)]'
                  )}
                >
                  {paginationPage}
                </Link>
              )
            })}
            {page < totalPages && (
              <Link
                href={dashboardAnnouncementsHref({ tab: activeTab, search, page: page + 1 })}
                className="flex h-10 items-center justify-center rounded-[0.85rem] border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-surface)_72%,transparent)] px-3 text-sm font-semibold text-[var(--color-text-muted)] transition-[transform,background,border-color,color] duration-200 hover:-translate-y-px hover:border-[var(--color-accent)] hover:text-[var(--color-text-primary)] active:scale-[0.98]"
              >
                Next
              </Link>
            )}
          </div>
        </nav>
      )}
    </div>
  )
}
