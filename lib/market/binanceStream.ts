import WebSocket from 'ws'
import { onPriceUpdate } from './pricePolling'

/**
 * Binance AggTrade Stream
 * - 가격(p)
 * - 체결 수량(q) 포함
 * → 고래 체결량 기반 분석용
 */
const ws = new WebSocket(
  'wss://stream.binance.com:9443/ws/btcusdt@aggTrade'
)

ws.on('open', () => {
  console.log('[BINANCE WS] aggTrade connected')
})

ws.on('message', async (raw) => {
  try {
    const data = JSON.parse(raw.toString())

    const price = Number(data.p) // 체결 가격
    const qty = Number(data.q)   // 🔥 체결 수량 (핵심)

    if (!Number.isFinite(price) || !Number.isFinite(qty)) {
      return
    }

    // ✅ 가격 + 체결량 전달
    await onPriceUpdate('BTCUSDT', price, qty)
  } catch (e) {
    console.error('[BINANCE WS] aggTrade message error', e)
  }
})

ws.on('error', (err) => {
  console.error('[BINANCE WS] error', err)
})

ws.on('close', () => {
  console.warn('[BINANCE WS] connection closed')
})
