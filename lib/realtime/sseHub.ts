import { createRedisSubscriber } from '@/lib/redis'

/* =========================
 * Types
 * ========================= */
type SSEScope = 'ALERTS' | 'REALTIME' | 'VIP'

type Client = {
  controller: ReadableStreamDefaultController<Uint8Array>
  scope: SSEScope
}

/* =========================
 * Internal State
 * ========================= */
const encoder = new TextEncoder()

// scope별 클라이언트 관리
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
  const set = clientsByScope[scope]

  set.add(client)

  console.log(
    `[SSE][${scope}] client connected. total:`,
    set.size,
  )

  // 연결 ACK (프론트 LIVE 표시용)
  controller.enqueue(
    encoder.encode(`event: connected\ndata: {}\n\n`),
  )

  return () => {
    set.delete(client)
    console.log(
      `[SSE][${scope}] client disconnected. total:`,
      set.size,
    )
  }
}

/* =========================
 * 🔥 Redis → SSE Bridge
 * ========================= */

/**
 * 🔒 진짜 전역 싱글톤 subscribe 보장
 * - Next dev / HMR / Turbopack 대응
 */
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

  sub.on('message', (_, message) => {
    const payload = encoder.encode(`data: ${message}\n\n`)

    // 🔁 scope별 fan-out
    ;(Object.keys(clientsByScope) as SSEScope[]).forEach(scope => {
      const set = clientsByScope[scope]
      if (!set.size) return

      for (const client of set) {
        try {
          client.controller.enqueue(payload)
        } catch {
          set.delete(client)
          console.warn(`[SSE][${scope}] drop closed client`)
        }
      }
    })
  })
}

/* =========================
 * 💓 Heartbeat (선택)
 * ========================= */
export function pushHeartbeat() {
  const ping = encoder.encode(`event: ping\ndata: {}\n\n`)

  ;(Object.keys(clientsByScope) as SSEScope[]).forEach(scope => {
    const set = clientsByScope[scope]
    if (!set.size) return

    for (const client of set) {
      try {
        client.controller.enqueue(ping)
      } catch {
        set.delete(client)
      }
    }
  })
}
