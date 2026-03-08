import { createRedisSubscriber } from '@/lib/redis'
import type { Redis } from 'ioredis'

import {
  setLastOI,
  setLastVolume,
  setLastFundingRate,
} from '@/lib/market/marketLastStateStore'

/* =========================
 * Types
 * ========================= */
export type SSEScope = 'ALERTS' | 'REALTIME' | 'VIP'

type Client = {
  controller: ReadableStreamDefaultController<Uint8Array>
  scope: SSEScope
}

/* =========================
 * Internal State
 * ========================= */

const encoder = new TextEncoder()

const clientsByScope: Record<SSEScope, Set<Client>> = {
  ALERTS: new Set(),
  REALTIME: new Set(),
  VIP: new Set(),
}

/* =========================================================
 * 🔥 VIP가 PUBLIC에서 받을 타입만 허용
 * ========================================================= */

const VIP_PUBLIC_ALLOW = new Set([
  'PRICE_TICK',
  'OI_TICK',
  'VOLUME_TICK',
  'FUNDING_RATE_TICK',
  'SENTIMENT_UPDATE',
  'WHALE_TRADE_FLOW',
  'WHALE_NET_PRESSURE',
  'WHALE_INTENSITY',

  /* 🔥 Bollinger 추가 */
  'BB_SIGNAL',
  'BB_LIVE_COMMENTARY',
])

/* =========================================================
 * 🔥 안전한 브로드캐스트 유틸
 * ========================================================= */

function broadcastPayload(
  scopes: SSEScope[],
  payload: Uint8Array,
) {
  for (const scope of scopes) {
    const clients = clientsByScope[scope]
    if (!clients.size) continue

    for (const client of clients) {
      try {
        client.controller.enqueue(payload)
      } catch {
        clients.delete(client)
      }
    }
  }
}

function broadcastToScope(scope: SSEScope, event: any) {
  const clients = clientsByScope[scope]
  if (!clients.size) return

  const payload = encoder.encode(
    `data: ${JSON.stringify(event)}\n\n`,
  )

  for (const client of clients) {
    try {
      client.controller.enqueue(payload)
    } catch {
      clients.delete(client)
    }
  }
}

/* =========================
 * SSE Client 등록
 * ========================= */

export function addSSEClient(
  controller: ReadableStreamDefaultController<Uint8Array>,
  options?: { scope?: SSEScope },
) {
  const scope: SSEScope = options?.scope ?? 'REALTIME'

  const client: Client = { controller, scope }

  clientsByScope[scope].add(client)

  controller.enqueue(
    encoder.encode(`event: connected\ndata: {}\n\n`),
  )

  return () => {
    clientsByScope[scope].delete(client)
  }
}

/* =========================
 * 🔥 Redis → SSE Bridge
 * ========================= */

const DERIVED_PUBLIC = 'realtime:derived:public'
const DERIVED_VIP = 'realtime:derived:vip'

const g = globalThis as typeof globalThis & {
  __SSE_REDIS_SUBSCRIBED__?: boolean
}

if (!g.__SSE_REDIS_SUBSCRIBED__) {
  g.__SSE_REDIS_SUBSCRIBED__ = true

  const sub: Redis = createRedisSubscriber()

  sub.subscribe(DERIVED_PUBLIC)
  sub.subscribe(DERIVED_VIP)

  sub.on('error', (err: Error) => {
    console.error('[SSE] Redis error', err)
  })

  sub.on('message', (channel: string, message: string) => {

    let event: any

    try {
      event = JSON.parse(message)
    } catch {
      return
    }

    /* =========================
     * SSOT 저장
     * ========================= */

    if (event?.type === 'OI_TICK') {
      try {
        setLastOI(event.symbol, event.openInterest)
      } catch {}
    }

    if (event?.type === 'VOLUME_TICK') {
      try {
        setLastVolume(event.symbol, event.volume)
      } catch {}
    }

    if (event?.type === 'FUNDING_RATE_TICK') {
      try {
        setLastFundingRate(event.symbol, event.fundingRate)
      } catch {}
    }

    /* =========================
     * 🔥 fanout 처리
     * ========================= */

    const payload = encoder.encode(
      `data: ${JSON.stringify(event)}\n\n`,
    )

    /* 1️⃣ VIP 채널 */

    if (channel === DERIVED_VIP) {
      broadcastPayload(['VIP'], payload)
      return
    }

    /* 2️⃣ PUBLIC 채널 */

    if (channel === DERIVED_PUBLIC) {

      if (event?.type === 'ALERT_TRIGGERED') {
        broadcastPayload(['ALERTS'], payload)
        return
      }

      /* REALTIME 항상 전달 */

      broadcastPayload(['REALTIME'], payload)

      /* VIP는 허용 타입만 */

      if (VIP_PUBLIC_ALLOW.has(event?.type)) {
        broadcastPayload(['VIP'], payload)
      }
    }
  })
}

/* =========================
 * 💓 Heartbeat
 * ========================= */

export function pushHeartbeat() {

  const ping = encoder.encode(`event: ping\ndata: {}\n\n`)

  for (const scope of Object.keys(clientsByScope) as SSEScope[]) {

    const clients = clientsByScope[scope]

    for (const client of clients) {
      try {
        client.controller.enqueue(ping)
      } catch {
        clients.delete(client)
      }
    }
  }
}

/* =========================
 * 🔥 Market Signal Broadcaster
 * ========================= */

export function broadcastMarketSignal(event: any) {

  const payload = encoder.encode(
    `data: ${JSON.stringify(event)}\n\n`,
  )

  broadcastPayload(['REALTIME', 'VIP'], payload)
}
