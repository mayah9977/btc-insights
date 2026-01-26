// lib/vip/useInitialRiskHistory.ts
'use client'

import { useEffect, useRef } from 'react'
import { useVipRiskHistoryStore } from './riskHistoryStore'

type ApiRiskItem = {
  ts: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME'
  judgement: string
}

/**
 * 🔥 초기 Risk 히스토리 1회 주입용 훅
 * - SSR ❌
 * - 실시간 SSE ❌
 * - "과거 확정 Risk"만 hydrate
 */
export function useInitialRiskHistory() {
  const hydratedRef = useRef(false)

  useEffect(() => {
    if (hydratedRef.current) return
    hydratedRef.current = true

    const hydrate =
      useVipRiskHistoryStore.getState().hydrate

    // ✅ 반드시 JSON 히스토리 API 사용 (PDF API ❌)
    fetch('/api/vip/risk-history')
      .then((res) => {
        if (!res.ok) return []
        return res.json()
      })
      .then((items: ApiRiskItem[]) => {
        if (!Array.isArray(items)) return

        hydrate(
          items.map((i) => ({
            level: i.riskLevel,
            reason: i.judgement,
            time: new Date(i.ts).toLocaleTimeString(
              'ko-KR',
              {
                hour: '2-digit',
                minute: '2-digit',
              },
            ),
          })),
        )
      })
      .catch(() => {
        /* UX 우선 – 조용히 실패 */
      })
  }, [])
}
