'use client'

import { useEffect, useRef, useState } from 'react'
import type { VIPLevel } from './vipTypes'
import type { RiskLevel } from './riskTypes'
import {
  subscribeVipLevel,
  subscribeVipRisk,
  subscribeVipKpi,
} from '@/lib/realtime/vipChannel'
import { handleRiskUpdate } from '@/lib/realtime/vipEffects'

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

    const unsubVip = subscribeVipLevel(vipLevel => {
      if (vipLevel !== lastVipRef.current) {
        lastVipRef.current = vipLevel
        setState(s => ({ ...s, vipLevel }))
      }
    })

    const unsubRisk = subscribeVipRisk(data => {
      handleRiskUpdate(data)
      setState(s => ({
        ...s,
        riskLevel: data.riskLevel,
        isExtreme: data.isExtreme,
        lastTriggeredAt: data.ts,
      }))
    })

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
