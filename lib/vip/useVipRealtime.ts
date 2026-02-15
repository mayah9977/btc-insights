'use client'

import { useEffect, useRef, useState } from 'react'
import type { VIPLevel } from './vipTypes'
import type { RiskLevel } from './riskTypes'

import {
  subscribeVipLevel,
  subscribeVipRisk,
  subscribeVipKpi,
} from '@/lib/realtime/vipChannel'

export type VipRealtimeState = {
  vipLevel: VIPLevel
  riskLevel: RiskLevel
  isExtreme: boolean
  lastTriggeredAt: number | null
}

const INITIAL_STATE: VipRealtimeState = {
  vipLevel: 'FREE',
  riskLevel: 'LOW',
  isExtreme: false,
  lastTriggeredAt: null,
}

export function useVipRealtime(
  userId: string,
  onKpiUpdate?: (kpi: any) => void,
) {
  const [state, setState] =
    useState<VipRealtimeState>(INITIAL_STATE)

  const lastVipRef = useRef<VIPLevel | null>(null)

  useEffect(() => {
    if (!userId) return

    /* =========================
     * VIP LEVEL
     * ========================= */
    const unsubVip = subscribeVipLevel(vipLevel => {
      if (vipLevel !== lastVipRef.current) {
        lastVipRef.current = vipLevel
        setState(s => ({ ...s, vipLevel }))
      }
    })

    /* =========================
     * 🔥 VIP RISK (UI 동기화만)
     * ========================= */
    const unsubRisk = subscribeVipRisk(data => {
      // ❗ Store 반영은 sseConnectionManager에서 이미 처리됨
      // ❗ 여기서는 UI용 state만 갱신

      setState(s => ({
        ...s,
        riskLevel: data.riskLevel,
        isExtreme: data.isExtreme,
        lastTriggeredAt: data.ts,
      }))
    })

    /* =========================
     * KPI
     * ========================= */
    const unsubKpi = onKpiUpdate
      ? subscribeVipKpi(onKpiUpdate)
      : () => {}

    return () => {
      unsubVip()
      unsubRisk()
      unsubKpi()
    }
  }, [userId, onKpiUpdate])

  return state
}
