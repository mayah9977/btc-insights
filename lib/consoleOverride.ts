// lib/consoleOverride.ts
let initialized = false

export function setupConsoleOverride() {
  if (initialized) return
  initialized = true

  if (typeof window === 'undefined') return

  const isProductionLike =
    process.env.NEXT_PUBLIC_APP_ENV === 'production'

  if (!isProductionLike) return

  const noop = () => {}

  globalThis.console.log = noop
  globalThis.console.debug = noop
  globalThis.console.warn = noop

  const originalError = globalThis.console.error.bind(globalThis.console)

  globalThis.console.error = (...args: unknown[]) => {
    originalError(...args)

    // Future Sentry extension point
    // Sentry.captureException(args[0])
  }
}
