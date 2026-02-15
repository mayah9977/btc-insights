// lib/vip/vipSSEHub.ts

import {
  setLastVipRisk,
} from '@/lib/vip/vipLastRiskStore'

export type VIPLevel = 'FREE' | 'VIP1' | 'VIP2' | 'VIP3'
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME'

type Client = {
  controller: ReadableStreamDefaultController<Uint8Array>
}

const encoder = new TextEncoder()

/**
 * userId 기준 SSE clients
 */
const clients = new Map<string, Set<Client>>()

/* =========================
 * Payload Type
 * ========================= */
export type VipRiskBroadcastPayload = {
  riskLevel: RiskLevel
  judgement: string
  confidence: number

  isExtreme: boolean
  ts: number

  pressureTrend?: 'UP' | 'DOWN' | 'STABLE'
  extremeProximity?: number

  // 🔥 UI / 체감 가속 전용 상태 플래그
  preExtreme?: boolean

  whaleAccelerated?: boolean
}

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
 * 🔔 공용 SSE Push
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
 * ✅ VIP 레벨 업데이트
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
 * 🔥 RISK_UPDATE broadcast (SSOT)
 * ========================= */
export function broadcastVipRiskUpdate(
  payload: VipRiskBroadcastPayload,
) {
  /**
   * 🔥 [ADD] preExtreme 상태 플래그 정규화
   * - 계산 ❌
   * - RiskLevel ❌
   * - UI 체감 전용 상태만 보존
   */
  const normalizedPayload: VipRiskBroadcastPayload = {
    ...payload,
    preExtreme: payload.preExtreme === true,
  }

  /**
   * ✅ 1️⃣ 서버 SSOT 저장
   * (SSE 재연결 / 최초 접속용)
   */
  setLastVipRisk(normalizedPayload)

  /**
   * ✅ 2️⃣ 서버 로그
   * - 개발 환경
   * - LOW 상태는 로그 제외
   */
  if (
    process.env.NODE_ENV !== 'production' &&
    normalizedPayload.riskLevel !== 'LOW'
  ) {
    console.log('[SSE SEND]', {
      type: 'RISK_UPDATE',
      payload: normalizedPayload,
      clientCount: clients.size,
    })
  }

  /**
   * ✅ 3️⃣ SSE push
   */
  for (const userId of clients.keys()) {
    pushUserEvent(userId, {
      type: 'RISK_UPDATE',
      ...normalizedPayload,
    })
  }
}

/* =========================
 * ✅ KPI 실시간 반영
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
