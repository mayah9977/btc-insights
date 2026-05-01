// lib/vip/vipSSEHub.ts
import { setLastVipRisk } from '@/lib/vip/vipLastRiskStore'
import type { VIPLevel } from './vipTypes'

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME'

type Client = {
  controller: ReadableStreamDefaultController<Uint8Array>
}

const encoder = new TextEncoder()
const clients = new Map<string, Set<Client>>()

export type VipRiskBroadcastPayload = {
  riskLevel: RiskLevel
  judgement: string
  confidence: number
  isExtreme: boolean
  ts: number
  pressureTrend?: 'UP' | 'DOWN' | 'STABLE'
  extremeProximity?: number
  preExtreme?: boolean
  whaleAccelerated?: boolean
}

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

export function pushVipUpdate(
  userId: string,
  payload: { vipLevel: VIPLevel },
) {
  pushUserEvent(userId, {
    type: 'VIP_LEVEL',
    vipLevel: payload.vipLevel,
  })
}

export function broadcastVipRiskUpdate(
  payload: VipRiskBroadcastPayload,
) {
  const normalizedPayload: VipRiskBroadcastPayload = {
    ...payload,
    preExtreme: payload.preExtreme === true,
  }

  setLastVipRisk(normalizedPayload)

  for (const userId of clients.keys()) {
    pushUserEvent(userId, {
      type: 'RISK_UPDATE',
      ...normalizedPayload,
    })
  }
}

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
