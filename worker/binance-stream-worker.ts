// worker/binance-stream-worker.ts

import 'dotenv/config'

process.env.DB_RUNTIME = 'worker'

const mode =
  process.env.BINANCE_WS_MODE === 'combined'
    ? 'combined'
    : 'multi'

const symbol = process.env.BINANCE_SYMBOL || 'BTCUSDT'

console.log('[BINANCE_WORKER_BOOT]', {
  symbol,
  mode,
  nodeEnv: process.env.NODE_ENV,
  at: new Date().toISOString(),
})

let stop: (() => void) | null = null

function shutdown(signal: string) {
  console.log('[BINANCE_WORKER_SHUTDOWN]', {
    signal,
    at: new Date().toISOString(),
  })

  try {
    stop?.()
  } catch (error) {
    console.error('[BINANCE_WORKER_SHUTDOWN_ERROR]', error)
  }

  process.exit(0)
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

process.on('uncaughtException', error => {
  console.error('[BINANCE_WORKER_UNCAUGHT_EXCEPTION]', error)
  shutdown('uncaughtException')
})

process.on('unhandledRejection', reason => {
  console.error('[BINANCE_WORKER_UNHANDLED_REJECTION]', reason)
})

async function start() {
  const { bootstrapBinanceMarketStreamOnce } =
    await import('@/lib/exchange/binanceWS')

  stop = bootstrapBinanceMarketStreamOnce({
    symbol,
    mode,
    debug: process.env.BINANCE_WS_DEBUG !== 'false',
  })
}

void start().catch(error => {
  console.error('[BINANCE_WORKER_UNCAUGHT_EXCEPTION]', error)
  process.exit(1)
})
