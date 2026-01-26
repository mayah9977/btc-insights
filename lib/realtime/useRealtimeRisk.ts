'use client'

import { useEffect, useState } from 'react'
import { subscribeVipRisk } from '@/lib/realtime/vipChannel'

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME'

export type RealtimeRiskState = {
  riskLevel: RiskLevel
  judgement: string
  scenarios: any[]
  isExtreme: boolean
  lastTriggeredAt: number | null
}

const INITIAL_STATE: RealtimeRiskState = {
  riskLevel: 'LOW',
  judgement: '',
  scenarios: [],
  isExtreme: false,
  lastTriggeredAt: null,
}

export function useRealtimeRisk() {
  const [state, setState] =
    useState<RealtimeRiskState>(INITIAL_STATE)

  useEffect(() => {
    const unsubscribe = subscribeVipRisk((data) => {
      setState({
        riskLevel: data.riskLevel,
        judgement: data.judgement ?? '',
        scenarios: data.scenarios ?? [],
        isExtreme: data.isExtreme,
        lastTriggeredAt: data.ts ?? Date.now(),
      })
    })

    return () => {
      unsubscribe()
    }
  }, [])

  return state
}
