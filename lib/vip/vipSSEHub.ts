// lib/vip/vipSSEHub.ts

type Client = {
  controller: ReadableStreamDefaultController<Uint8Array>
}

const encoder = new TextEncoder()

/**
 * userId 기준 SSE clients
 */
const clients = new Map<string, Set<Client>>()

/* =========================
 * SSE 등록
 * ========================= */
export function addVipClient(
  userId: string,
  controller: ReadableStreamDefaultController<Uint8Array>,
) {
  const client: Client = { controller }

  if (!clients.has(userId)) {
    clients.set(userId, new Set())
  }

  clients.get(userId)!.add(client)

  return () => {
    clients.get(userId)?.delete(client)
  }
}

/* =========================
 * 🔔 공용 SSE Push
 * ========================= */
export function pushUserEvent(
  userId: string,
  payload: Record<string, unknown>, // ✅ object 타입으로 고정
) {
  const set = clients.get(userId)
  if (!set || set.size === 0) return

  const message = encoder.encode(
    `data: ${JSON.stringify(payload)}\n\n`,
  )

  for (const client of set) {
    try {
      client.controller.enqueue(message)
    } catch {
      set.delete(client)
    }
  }
}

/* =========================
 * (호환) VIP 전용 wrapper
 * ========================= */
export function pushVipUpdate(
  userId: string,
  payload: Record<string, unknown>, // ✅ spread 가능
) {
  pushUserEvent(userId, {
    type: 'VIP_UPDATE',
    ...payload,
  })
}
