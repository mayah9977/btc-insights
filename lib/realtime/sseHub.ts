import { createRedisSubscriber } from '@/lib/redis/index'
import type { Redis } from 'ioredis'

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

  // 연결 ACK
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
const g = globalThis as typeof globalThis & {
  __SSE_REDIS_SUBSCRIBED__?: boolean
}

if (!g.__SSE_REDIS_SUBSCRIBED__) {
  g.__SSE_REDIS_SUBSCRIBED__ = true

  const sub: Redis = createRedisSubscriber()

  /* Redis 채널 */
  sub.subscribe('realtime:market')

  sub.on('subscribe', (channel: string, count: number) => {
    console.log('[SSE] Redis subscribed:', channel, 'count=', count)
  })

  sub.on('error', (err: Error) => {
    console.error('[SSE] Redis error', err)
  })

  /* 메시지 수신 */
  sub.on('message', (_channel: string, message: string) => {
    let event: any

    try {
      event = JSON.parse(message)
    } catch (e) {
      console.error('[SSE] JSON parse error', e)
      return
    }

    /* =========================
     * 🔥 이벤트 → scope 매핑
     * ========================= */
    let targetScope: SSEScope | null = null

    if (event.type === 'ALERT_TRIGGERED') {
      targetScope = 'ALERTS'
    } else if (
      event.type === 'PRICE_TICK' ||
      event.type === 'VOLUME_TICK' ||
      event.type === 'OI_TICK' ||
      event.type === 'WHALE_WARNING' ||
      event.type === 'WHALE_INTENSITY_TICK' // ✅ 최종 추가
    ) {
      targetScope = 'REALTIME'
    } else if (event.type === 'VIP_UPDATE') {
      targetScope = 'VIP'
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

  ;(Object.keys(clientsByScope) as SSEScope[]).forEach(scope => {
    for (const client of clientsByScope[scope]) {
      try {
        client.controller.enqueue(ping)
      } catch {
        clientsByScope[scope].delete(client)
      }
    }
  })
}
