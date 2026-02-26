'use strict'

/**
 * ⚠ DISABLED FILE
 *
 * Price polling via REST API has been deprecated.
 * Real-time price is now handled via Binance WebSocket (aggTrade stream).
 *
 * Do NOT re-enable unless architecture changes.
 */

console.warn(
  '[PRICE POLLER] DISABLED - WebSocket architecture active',
)

// 실행 즉시 종료 (안전)
process.exit(0)
