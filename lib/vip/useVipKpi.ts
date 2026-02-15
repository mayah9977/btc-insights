'use client'

import { useEffect, useState } from 'react'

export type VipKpiState = {
  avoidedExtremeCount: number
  avoidedLossUSD: number

  weeklySummary: {
    period: '7d'
    avoidedLossUSD: number
    avoidedExtremeCount: number
  }

  monthlySummary: {
    period: '30d'
    avoidedLossUSD: number
    avoidedExtremeCount: number
  }

  vip3Metrics: {
    extremeAccuracy: number
    avgAvoidedLoss30d: number
    stableZoneRatio: number
    confidenceScore: number
  }

  loading: boolean
}

const FALLBACK: VipKpiState = {
  avoidedExtremeCount: 0,
  avoidedLossUSD: 0,

  weeklySummary: {
    period: '7d',
    avoidedLossUSD: 0,
    avoidedExtremeCount: 0,
  },

  monthlySummary: {
    period: '30d',
    avoidedLossUSD: 0,
    avoidedExtremeCount: 0,
  },

  vip3Metrics: {
    extremeAccuracy: 0,
    avgAvoidedLoss30d: 0,
    stableZoneRatio: 0,
    confidenceScore: 0,
  },

  loading: true,
}

export function useVipKpi(): VipKpiState {
  const [state, setState] = useState<VipKpiState>(FALLBACK)

  useEffect(() => {
    fetch('/api/vip/kpi')
      .then(r => r.json())
      .then(data => {
        
        setState({
          avoidedExtremeCount:
            data?.kpi?.avoidedExtremeCount ?? 0,
          avoidedLossUSD:
            data?.kpi?.avoidedLossUSD ?? 0,

          weeklySummary:
            data?.kpi?.weeklySummary ??
            FALLBACK.weeklySummary,

          monthlySummary:
            data?.kpi?.monthlySummary ??
            FALLBACK.monthlySummary,

          vip3Metrics:
            data?.vip3 ??
            FALLBACK.vip3Metrics,

          loading: false,
        })
      })
      .catch(() => {
        setState(s => ({ ...s, loading: false }))
      })
  }, [])

  return state
}
