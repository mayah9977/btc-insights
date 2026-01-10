import { createRedisSubscriber } from '@/lib/redis'

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

// scope별 SSE client 관리
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

  // 연결 ACK (브라우저 안정화)
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
 * - 전역 싱글톤 보장 (Next dev / HMR 안전)
 * ========================= */
const g = globalThis as any

if (!g.__SSE_REDIS_SUBSCRIBED__) {
  g.__SSE_REDIS_SUBSCRIBED__ = true

  const sub = createRedisSubscriber()

  sub.subscribe('realtime:market', err => {
    if (err) {
      console.error('[SSE] Redis subscribe failed', err)
    } else {
      console.log('[SSE] Redis subscribed: realtime:market')
    }
  })

  sub.on('message', (_channel, message) => {
    let event: any

    try {
      event = JSON.parse(message)
    } catch (e) {
      console.error('[SSE] JSON parse error', e)
      return
    }

    /* =========================
     * 이벤트 타입 → scope 매핑
     * ========================= */
    let targetScope: SSEScope | null = null

    if (event.type === 'ALERT_TRIGGERED') {
      targetScope = 'ALERTS'
    } else if (event.type === 'PRICE_TICK') {
      targetScope = 'REALTIME'
    } else if (event.type === 'VIP_UPDATE') {
      targetScope = 'VIP'
    }

    // ❌ OI_TICK 등은 여기서 자연스럽게 drop
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
 * 💓 Heartbeat (optional)
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
