'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { Search, FileText, CheckCircle2, Archive, PenLine } from 'lucide-react'
import { AnnouncementRow } from '@/components/dashboard/AnnouncementRow'
import type { AnnouncementRowData } from '@/components/dashboard/AnnouncementRow'
import { cn } from '@/lib/utils'

type Tab = 'all' | 'published' | 'drafts' | 'archived'

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'all', label: 'All', icon: FileText },
  { id: 'published', label: 'Published', icon: CheckCircle2 },
  { id: 'drafts', label: 'Drafts', icon: PenLine },
  { id: 'archived', label: 'Archived', icon: Archive },
]

const PAGE_SIZE = 10

interface AnnouncementsClientProps {
  announcements: AnnouncementRowData[]
}

function EmptyState({ tab }: { tab: Tab }) {
  const messages: Record<Tab, { title: string; body: string }> = {
    all: { title: 'No announcements yet', body: 'Create your first announcement to get started.' },
    published: { title: 'Nothing published', body: 'Published announcements will appear here.' },
    drafts: { title: 'No drafts', body: 'Save an announcement as a draft to see it here.' },
    archived: { title: 'Nothing archived', body: 'Archived announcements will appear here.' },
  }
  const { title, body } = messages[tab]
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-12 h-12 rounded-2xl bg-[var(--color-accent-surface)] flex items-center justify-center mb-4">
        <FileText size={20} className="text-[var(--color-accent)]" />
      </div>
      <h3 className="text-base font-semibold text-[var(--color-text-primary)]">{title}</h3>
      <p className="text-sm text-[var(--color-text-muted)] mt-1">{body}</p>
    </div>
  )
}

export function AnnouncementsClient({ announcements }: AnnouncementsClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('all')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [animKey, setAnimKey] = useState(0)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })

  // Update indicator position on tab change
  useEffect(() => {
    const idx = TABS.findIndex((t) => t.id === activeTab)
    const el = tabRefs.current[idx]
    if (el) {
      setIndicatorStyle({ left: el.offsetLeft, width: el.offsetWidth })
    }
  }, [activeTab])

  // Filter by tab + search
  const filtered = useMemo(() => {
    let items = announcements

    if (activeTab === 'published') {
      items = items.filter((a) => a.status === 'published')
    } else if (activeTab === 'drafts') {
      items = items.filter((a) => a.status === 'draft')
    } else if (activeTab === 'archived') {
      items = items.filter((a) => a.status === 'archived' || a.status === 'expired')
    }

    if (query.trim()) {
      const q = query.toLowerCase()
      items = items.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.categories?.name.toLowerCase().includes(q) ||
          a.organizations?.name.toLowerCase().includes(q)
      )
    }

    return items
  }, [announcements, activeTab, query])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const clampedPage = Math.min(page, totalPages)
  const startIdx = (clampedPage - 1) * PAGE_SIZE
  const endIdx = Math.min(startIdx + PAGE_SIZE, filtered.length)
  const pageItems = filtered.slice(startIdx, endIdx)

  function changeTab(tab: Tab) {
    setActiveTab(tab)
    setPage(1)
    setQuery('')
    setAnimKey((k) => k + 1)
  }

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value)
    setPage(1)
  }

  return (
    <div className="space-y-5">
      {/* Tab strip */}
      <div className="relative border-b border-[var(--color-glass-border)]">
        <div className="flex gap-0">
          {TABS.map((tab, i) => (
            <button
              key={tab.id}
              ref={(el) => { tabRefs.current[i] = el }}
              onClick={() => changeTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors relative',
                activeTab === tab.id
                  ? 'text-[var(--color-accent)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
              )}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
        {/* Animated underline indicator */}
        <div
          className="absolute bottom-0 h-0.5 bg-[var(--color-accent)] rounded-full transition-all duration-200"
          style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
        />
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none"
        />
        <input
          type="text"
          value={query}
          onChange={handleSearch}
          placeholder="Search announcements…"
          className={cn(
            'w-full pl-9 pr-4 py-2.5 text-sm bg-transparent',
            'text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)]',
            'border-0 border-b border-[var(--color-glass-border)]',
            'focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:rounded-lg focus:border-transparent',
            'transition-all duration-200'
          )}
        />
      </div>

      {/* Announcement list */}
      {pageItems.length === 0 ? (
        <EmptyState tab={activeTab} />
      ) : (
        <div className="space-y-3" key={animKey}>
          {pageItems.map((announcement, i) => (
            <AnnouncementRow
              key={announcement.id}
              announcement={announcement}
              style={{
                animation: `fade-up 400ms cubic-bezier(0.25,1,0.5,1) both`,
                animationDelay: `${i * 50}ms`,
              }}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-[var(--color-text-muted)]">
            Showing <span className="font-medium text-[var(--color-text-primary)]">{startIdx + 1}</span> to{' '}
            <span className="font-medium text-[var(--color-text-primary)]">{endIdx}</span> of{' '}
            <span className="font-medium text-[var(--color-text-primary)]">{filtered.length}</span> results
          </p>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={cn(
                  'w-9 h-9 flex items-center justify-center text-sm font-medium',
                  'rounded-xl border transition-all duration-300',
                  'bg-[var(--color-glass-bg)] backdrop-blur-[16px]',
                  p === clampedPage
                    ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white'
                    : 'border-[var(--color-glass-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:-translate-y-0.5 hover:border-[var(--color-accent)]/40'
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
