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

  controller.enqueue(
    encoder.encode(`event: connected\ndata: {}\n\n`),
  )

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

// 🔥 채널 분리 (최신 구조)
const DERIVED_PUBLIC = 'realtime:derived:public'
const DERIVED_VIP = 'realtime:derived:vip'

const g = globalThis as typeof globalThis & {
  __SSE_REDIS_SUBSCRIBED__?: boolean
}

if (!g.__SSE_REDIS_SUBSCRIBED__) {
  g.__SSE_REDIS_SUBSCRIBED__ = true

  const sub: Redis = createRedisSubscriber()

  // 🔥 두 채널 구독
  sub.subscribe(DERIVED_PUBLIC)
  sub.subscribe(DERIVED_VIP)

  sub.on('subscribe', (channel: string, count: number) => {
    console.log('[SSE] Redis subscribed:', channel, 'count=', count)
  })

  sub.on('error', (err: Error) => {
    console.error('[SSE] Redis error', err)
  })

  sub.on('message', (channel: string, message: string) => {
    let event: any

    try {
      event = JSON.parse(message)
    } catch (e) {
      console.error('[SSE] JSON parse error', e)
      return
    }

    /* =========================
     * ✅ Market SSOT 저장 (Replay용)
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
     * 🔥 channel 기반 scope 결정
     * ========================= */
    let targetScope: SSEScope | null = null

    if (channel === DERIVED_VIP) {
      targetScope = 'VIP'
    } else if (channel === DERIVED_PUBLIC) {
      if (event.type === 'ALERT_TRIGGERED') {
        targetScope = 'ALERTS'
      } else {
        targetScope = 'REALTIME'
      }
    }

    if (!targetScope) return

    const set = clientsByScope[targetScope]
    if (!set.size) return

    const payload = encoder.encode(
      `data: ${JSON.stringify(event)}\n\n`,
    )

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

  ;(Object.keys(clientsByScope) as SSEScope[]).forEach(
    (scope) => {
      for (const client of clientsByScope[scope]) {
        try {
          client.controller.enqueue(ping)
        } catch {
          clientsByScope[scope].delete(client)
        }
      }
    },
  )
}

/* =========================
 * 🔥 Market Signal Broadcaster (placeholder)
 * ========================= */
export function broadcastMarketSignal(_event: any) {
  return
}
