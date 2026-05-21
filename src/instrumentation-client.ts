import * as Sentry from '@sentry/nextjs'
import posthog from 'posthog-js'

const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN
const posthogToken = process.env.NEXT_PUBLIC_POSTHOG_TOKEN

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    sendDefaultPii: false,
  })
}

if (posthogToken) {
  posthog.init(posthogToken, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
    defaults: '2026-01-30',
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: false,
    disable_session_recording: process.env.NEXT_PUBLIC_POSTHOG_SESSION_REPLAY !== '1',
  })
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
