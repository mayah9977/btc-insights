// lib/vip/useRiskHeatmapSync.ts
'use client'

import { useEffect, useRef } from 'react'
import {
  useVipScenarioStore,
  type RiskLevel,
} from './scenarioStore'

/**
 * 🔥 실시간 Risk → Heatmap 동기화
 * - 최신 Risk만 반영
 * - 같은 시간(hour) 중복 업데이트 방지
 * - SSOT: scenarioStore
 */
export function useRiskHeatmapSync(riskLevel: RiskLevel) {
  const lastHourRef = useRef<number | null>(null)

  useEffect(() => {
    if (!riskLevel) return

    const hour = new Date().getHours()
    if (hour < 0 || hour > 23) return

    // ✅ 같은 시간 중복 기록 방지
    if (lastHourRef.current === hour) return
    lastHourRef.current = hour

    const { heatmap, setHeatmap } =
      useVipScenarioStore.getState()

    const next = heatmap.filter(
      (h) => h.hour !== hour,
    )

    next.push({
      hour,
      risk: riskLevel,
      scenarioBias:
        riskLevel === 'EXTREME' || riskLevel === 'HIGH'
          ? 'bear'
          : riskLevel === 'LOW'
          ? 'bull'
          : 'neutral',
    })

    // ✅ 반드시 공식 setter 사용
    setHeatmap(
      next.sort((a, b) => a.hour - b.hour),
    )
  }, [riskLevel])
}
