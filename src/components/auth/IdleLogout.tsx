'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

const IDLE_TIMEOUT_MS = 5 * 60 * 1000
const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'scroll', 'touchstart'] as const

export function IdleLogout() {
  const timerRef = useRef<number | null>(null)
  const hasSessionRef = useRef(false)
  const signingOutRef = useRef(false)

  useEffect(() => {
    const supabase = createClient()
    let disposed = false

    function clearIdleTimer() {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }

    async function signOutForIdle() {
      if (signingOutRef.current || !hasSessionRef.current) return
      signingOutRef.current = true
      await supabase.auth.signOut()
      if (!disposed) window.location.assign('/login?error=session_timeout')
    }

    function scheduleIdleTimer() {
      clearIdleTimer()
      if (!hasSessionRef.current || document.visibilityState === 'hidden') return
      timerRef.current = window.setTimeout(signOutForIdle, IDLE_TIMEOUT_MS)
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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

  return null
}
