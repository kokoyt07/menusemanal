import * as Sentry from '@sentry/react'

export { Sentry }

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (!dsn) return  // graceful no-op when DSN not configured

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    release: typeof __APP_VERSION__ !== 'undefined' ? String(__APP_VERSION__) : undefined,
    integrations: [
      Sentry.browserTracingIntegration(),
    ],
    // Sample 10% of transactions in production, none in development
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 0,
  })
}
