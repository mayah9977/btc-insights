// lib/vip/vipSSEHub.ts

export type VIPLevel = 'FREE' | 'VIP1' | 'VIP2' | 'VIP3'

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
    const set = clients.get(userId)
    if (!set) return

    set.delete(client)
    if (set.size === 0) {
      clients.delete(userId)
    }
  }
}

/* =========================
 * 🔔 공용 SSE Push (user 단위)
 * ========================= */
function pushUserEvent(
  userId: string,
  payload: Record<string, unknown>,
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
 * ✅ VIP 레벨 업데이트 (user 단위)
 * ========================= */
export function pushVipUpdate(
  userId: string,
  payload: { vipLevel: VIPLevel },
) {
  pushUserEvent(userId, {
    type: 'VIP_LEVEL',
    vipLevel: payload.vipLevel,
  })
}

/* =========================
 * ❌ (유지하되 사용 금지)
 * 개별 유저 Risk 전송은 잘못된 설계
 * ========================= */
export function pushVipRiskUpdate(
  userId: string,
  payload: {
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME'
    judgement: string
    isExtreme: boolean
    ts: number
  },
) {
  pushUserEvent(userId, {
    type: 'RISK_UPDATE',
    ...payload,
  })
}

/* =========================
 * 🔥 RISK_UPDATE broadcast (SSOT) ✅ 정답
 * ========================= */
export function broadcastVipRiskUpdate(payload: {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME'
  judgement: string
  isExtreme: boolean
  ts: number
}) {
  for (const userId of clients.keys()) {
    pushUserEvent(userId, {
      type: 'RISK_UPDATE',
      ...payload,
    })
  }
}

/* =========================
 * ✅ KPI 실시간 반영 (broadcast)
 * ========================= */
export function broadcastVipKpi(
  kpi: Record<string, unknown>,
) {
  for (const userId of clients.keys()) {
    pushUserEvent(userId, {
      type: 'VIP_KPI_UPDATE',
      kpi,
    })
  }
}
