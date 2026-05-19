'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const IDLE_TIMEOUT_MS = 5 * 60 * 1000
const IDLE_WARNING_MS = 30 * 1000
const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'scroll', 'touchstart'] as const

export function IdleLogout() {
  const warningTimerRef = useRef<number | null>(null)
  const logoutTimerRef = useRef<number | null>(null)
  const countdownRef = useRef<number | null>(null)
  const hasSessionRef = useRef(false)
  const signingOutRef = useRef(false)
  const [showWarning, setShowWarning] = useState(false)
  const [secondsRemaining, setSecondsRemaining] = useState(IDLE_WARNING_MS / 1000)

  useEffect(() => {
    const supabase = createClient()
    let disposed = false

    function clearIdleTimer() {
      if (warningTimerRef.current !== null) {
        window.clearTimeout(warningTimerRef.current)
        warningTimerRef.current = null
      }
      if (logoutTimerRef.current !== null) {
        window.clearTimeout(logoutTimerRef.current)
        logoutTimerRef.current = null
      }
      if (countdownRef.current !== null) {
        window.clearInterval(countdownRef.current)
        countdownRef.current = null
      }
    }

    async function signOutForIdle() {
      if (signingOutRef.current || !hasSessionRef.current) return
      signingOutRef.current = true
      await supabase.auth.signOut()
      if (!disposed) window.location.assign('/login?error=session_timeout')
    }

    function beginIdleWarning() {
      if (!hasSessionRef.current || disposed) return
      setSecondsRemaining(IDLE_WARNING_MS / 1000)
      setShowWarning(true)

      logoutTimerRef.current = window.setTimeout(signOutForIdle, IDLE_WARNING_MS)
      countdownRef.current = window.setInterval(() => {
        setSecondsRemaining((current) => Math.max(current - 1, 0))
      }, 1000)
    }

    function scheduleIdleTimer() {
      clearIdleTimer()
      setShowWarning(false)
      if (!hasSessionRef.current || document.visibilityState === 'hidden') return
      warningTimerRef.current = window.setTimeout(
        beginIdleWarning,
        IDLE_TIMEOUT_MS - IDLE_WARNING_MS
      )
    }

    function handleActivity() {
      scheduleIdleTimer()
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') scheduleIdleTimer()
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (disposed) return
      hasSessionRef.current = Boolean(session)
      scheduleIdleTimer()
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      hasSessionRef.current = Boolean(session)
      signingOutRef.current = false
      scheduleIdleTimer()
    })

    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, handleActivity, { passive: true })
    })
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      disposed = true
      clearIdleTimer()
      subscription.unsubscribe()
      ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, handleActivity)
      })
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  function stayLoggedIn() {
    const event = new Event('keydown')
    window.dispatchEvent(event)
  }

  if (!showWarning) return null

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(36,24,21,0.42)] px-4 backdrop-blur-sm"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="idle-timeout-title"
        aria-describedby="idle-timeout-description"
        className="w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-soft)]"
      >
        <h2
          id="idle-timeout-title"
          className="text-lg font-semibold text-[var(--color-text-primary)]"
        >
          Still there?
        </h2>
        <p
          id="idle-timeout-description"
          className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]"
        >
          You&apos;ll be logged out in {secondsRemaining} seconds.
        </p>
        <button
          type="button"
          onClick={stayLoggedIn}
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[var(--color-accent)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-inti)] focus-visible:ring-offset-2"
        >
          Stay logged in
        </button>
      </div>
    </div>
  )
}
