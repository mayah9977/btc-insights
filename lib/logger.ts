type LogFn = (...args: unknown[]) => void

const isProd =
  process.env.NODE_ENV === 'production' ||
  process.env.NEXT_PUBLIC_APP_ENV === 'production'

const noop: LogFn = () => {}

export const logger = {
  log: (isProd ? noop : console.log.bind(console)) as LogFn,
  debug: (isProd ? noop : console.debug.bind(console)) as LogFn,
  warn: (isProd ? noop : console.warn.bind(console)) as LogFn,

  info: (isProd ? noop : console.info.bind(console)) as LogFn,

  error: ((...args: unknown[]) => {
    console.error(...args)

    // 🔥 Sentry 확장 지점
    // Sentry.captureException(args[0])
  }) as LogFn,
}
