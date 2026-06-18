'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CornerDownLeft, Search } from 'lucide-react'
import { cn } from '@/shared/utils'
import type { NavItem } from './nav-config'

interface CommandPaletteProps {
  items: NavItem[]
  placeholder?: string
}

export function CommandPalette({ items, placeholder = 'Search or jump to…' }: CommandPaletteProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const openRef = useRef(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((item) => item.label.toLowerCase().includes(q))
  }, [items, query])

  const setPaletteOpen = useCallback((next: boolean) => {
    openRef.current = next
    setOpen(next)
    if (next) {
      setQuery('')
      setActiveIndex(0)
    }
  }, [])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPaletteOpen(!openRef.current)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [setPaletteOpen])

  useEffect(() => {
    if (!open) return
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 0)
    return () => window.clearTimeout(focusTimer)
  }, [open])

  const navigate = useCallback(
    (item: NavItem | undefined) => {
      if (!item) return
      setPaletteOpen(false)
      router.push(item.href)
    },
    [router, setPaletteOpen]
  )

  function onQueryChange(event: React.ChangeEvent<HTMLInputElement>) {
    setQuery(event.target.value)
    setActiveIndex(0)
  }

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => Math.min(index + 1, results.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => Math.max(index - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      navigate(results[activeIndex])
    } else if (event.key === 'Escape') {
      event.preventDefault()
      setPaletteOpen(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setPaletteOpen(true)}
        className={cn(
          'group flex min-h-11 items-center gap-2.5 rounded-full border border-[var(--color-border)] px-3.5',
          'bg-[color-mix(in_oklab,var(--color-surface)_72%,transparent)] text-sm text-[var(--color-text-muted)]',
          'transition-[border-color,background,color] duration-200',
          'hover:border-[color-mix(in_oklab,var(--color-accent-inti)_28%,var(--color-border))] hover:text-[var(--color-text-secondary)]',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-inti)]',
          'w-11 justify-center sm:w-56 sm:justify-start md:w-72'
        )}
        aria-label="Open command menu"
      >
        <Search size={16} className="shrink-0" aria-hidden="true" />
        <span className="hidden flex-1 truncate text-left sm:inline">{placeholder}</span>
        <kbd className="hidden items-center gap-0.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-1.5 py-0.5 font-mono text-[0.65rem] font-semibold text-[var(--color-text-muted)] sm:inline-flex">
          ⌘K
        </kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]"
          role="dialog"
          aria-modal="true"
          aria-label="Command menu"
        >
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            onClick={() => setPaletteOpen(false)}
            className="absolute inset-0 animate-[fade-up_140ms_var(--ease-ui)_both] cursor-default bg-[var(--color-shell-backdrop)] backdrop-blur-[3px]"
          />
          <div className="relative w-full max-w-xl animate-[fade-up_180ms_var(--ease-ui)_both] overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-hover)]">
            <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-4">
              <Search
                size={18}
                className="shrink-0 text-[var(--color-text-muted)]"
                aria-hidden="true"
              />
              <input
                ref={inputRef}
                value={query}
                onChange={onQueryChange}
                onKeyDown={onInputKeyDown}
                placeholder={placeholder}
                aria-label="Search destinations"
                aria-activedescendant={results[activeIndex] ? `cmd-${activeIndex}` : undefined}
                className="min-h-14 flex-1 bg-transparent text-base text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
              />
              <kbd className="hidden items-center rounded-md border border-[var(--color-border)] px-1.5 py-0.5 font-mono text-[0.65rem] text-[var(--color-text-muted)] sm:inline-flex">
                esc
              </kbd>
            </div>

            <ul
              role="listbox"
              aria-label="Destinations"
              className="max-h-[min(60vh,24rem)] overflow-y-auto p-2"
            >
              {results.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-[var(--color-text-muted)]">
                  No matches for “{query}”
                </li>
              ) : (
                results.map((item, index) => {
                  const Icon = item.icon
                  const active = index === activeIndex
                  return (
                    <li key={item.href} id={`cmd-${index}`} role="option" aria-selected={active}>
                      <button
                        type="button"
                        onClick={() => navigate(item)}
                        onMouseMove={() => setActiveIndex(index)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-[var(--radius-lg)] px-3 py-2.5 text-left text-sm font-medium transition-colors',
                          active
                            ? 'bg-[var(--color-accent-surface)] text-[var(--color-accent)]'
                            : 'text-[var(--color-text-secondary)]'
                        )}
                      >
                        <Icon size={17} className="shrink-0" aria-hidden="true" />
                        <span className="flex-1 truncate">{item.label}</span>
                        {active && (
                          <CornerDownLeft
                            size={14}
                            className="shrink-0 text-[var(--color-text-muted)]"
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    </li>
                  )
                })
              )}
            </ul>
          </div>
        </div>
      )}
    </>
  )
}
