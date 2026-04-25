import 'dotenv/config'
import { bootstrapBinanceMarketStreamOnce } from '@/lib/exchange/binanceWS'

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

const stop = bootstrapBinanceMarketStreamOnce({
  symbol,
  mode,
  debug: process.env.BINANCE_WS_DEBUG !== 'false',
})

function shutdown(signal: string) {
  console.log('[BINANCE_WORKER_SHUTDOWN]', {
    signal,
    at: new Date().toISOString(),
  })

  try {
    stop()
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
