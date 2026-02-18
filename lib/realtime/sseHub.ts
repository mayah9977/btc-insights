import { createRedisSubscriber } from '@/lib/redis/index'
import type { Redis } from 'ioredis'

// 🔥 Market SSOT 저장
import { setLastOI, setLastVolume } from '@/lib/market/marketLastStateStore'

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

  console.log(
    `[SSE][${scope}] client connected. total=${clientsByScope[scope].size}`,
  )

  controller.enqueue(encoder.encode(`event: connected\ndata: {}\n\n`))

  return () => {
    clientsByScope[scope].delete(client)
    console.log(
      `[SSE][${scope}] client disconnected. total=${clientsByScope[scope].size}`,
    )
  }
}

/* =========================
 * 🔥 Redis → SSE Bridge
 * ========================= */
const g = globalThis as typeof globalThis & { __SSE_REDIS_SUBSCRIBED__?: boolean }

if (!g.__SSE_REDIS_SUBSCRIBED__) {
  g.__SSE_REDIS_SUBSCRIBED__ = true

  const sub: Redis = createRedisSubscriber()

  sub.subscribe('realtime:market')

  sub.on('subscribe', (channel: string, count: number) => {
    console.log('[SSE] Redis subscribed:', channel, 'count=', count)
  })

  sub.on('error', (err: Error) => {
    console.error('[SSE] Redis error', err)
  })

  sub.on('message', (_channel: string, message: string) => {
    let event: any

    try {
      event = JSON.parse(message)
    } catch (e) {
      console.error('[SSE] JSON parse error', e)
      return
    }

    /* =========================
     * ✅ Market SSOT 저장 (REPLAY용)
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

    /* =========================
     * 🔥 이벤트 → scope 매핑 (수정 핵심)
     * ========================= */
    let targetScope: SSEScope | null = null

    if (event.type === 'ALERT_TRIGGERED') {
      targetScope = 'ALERTS'
    } else if (
      event.type === 'PRICE_TICK' ||
      event.type === 'VOLUME_TICK' ||
      event.type === 'OI_TICK' ||
      event.type === 'FUNDING_RATE_TICK' ||
      event.type === 'WHALE_WARNING' ||
      event.type === 'WHALE_INTENSITY_TICK' ||
      event.type === 'BB_SIGNAL' ||
      // ✅ 추가
      event.type === 'BB_LIVE_COMMENTARY' // ✅ 추가 (핵심)
    ) {
      targetScope = 'REALTIME'
    } else if (event.type === 'VIP_UPDATE') {
      targetScope = 'VIP'
    }

    if (!targetScope) return

    const set = clientsByScope[targetScope]
    if (!set.size) return

    const payload = encoder.encode(`data: ${JSON.stringify(event)}\n\n`)

    for (const client of set) {
      try {
        client.controller.enqueue(payload)
      } catch {
        set.delete(client)
        console.warn(`[SSE][${targetScope}] drop closed client`)
      }
    }
  })
}

/* =========================
 * 💓 Heartbeat
 * ========================= */
export function pushHeartbeat() {
  const ping = encoder.encode(`event: ping\ndata: {}\n\n`)

  ;(Object.keys(clientsByScope) as SSEScope[]).forEach((scope) => {
    for (const client of clientsByScope[scope]) {
      try {
        client.controller.enqueue(ping)
      } catch {
        clientsByScope[scope].delete(client)
      }
    }
  })
}

/* =========================
 * 🔥 Market Signal Broadcaster (ADD)
 * ========================= */
export function broadcastMarketSignal(event: any) {
  try {
    return
  } catch (e) {
    console.error('[SSE] broadcastMarketSignal error', e)
  }
}
