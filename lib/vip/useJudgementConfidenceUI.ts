'use client'

import { useMemo, useRef } from 'react'
import { useLiveRiskState } from '@/lib/realtime/liveRiskState'
import { useVipJudgementStore } from '@/lib/vip/judgementStore'

/**
 * 🔥 UI Heartbeat 전용 판단 신뢰도 엔진
 *
 * 역할
 * - 서버 rawConfidence = 기준값 (SSOT)
 * - Stable Zone(LOW / MEDIUM) 유지 시간에 따라 점진 상승
 * - HIGH / EXTREME 진입 시 즉시 rawConfidence로 리셋
 * - UI persistence로 깜빡임 / 미세 하락 방지
 * - 모든 UI(Judgement / Panel / Snapshot)의 단일 confidence 출처
 */
export function useJudgementConfidenceUI() {
  const live = useLiveRiskState(s => s.state)

  // ✅ SSOT 기준값
  const rawConfidence = useVipJudgementStore(
    s => s.rawConfidence,
  )

  // ✅ UI persistence (렌더 간 값 유지)
  const lastUiConfidenceRef = useRef<number>(rawConfidence)

  return useMemo(() => {
    // 🔹 liveRisk 아직 없을 때
    if (!live) {
      lastUiConfidenceRef.current = rawConfidence
      return rawConfidence
    }

    const { level, durationSec } = live

    // ❌ HIGH / EXTREME → 보정 금지 + 즉시 리셋
    if (level === 'HIGH' || level === 'EXTREME') {
      lastUiConfidenceRef.current = rawConfidence
      return rawConfidence
    }

    /**
     * ✅ Stable Zone (LOW / MEDIUM)
     * - 시간 기반 점진 상승
     * - rawConfidence는 절대 기준선
     */
    const bonus = Math.min(durationSec * 0.002, 0.2) // 최대 +20%
    const uiConfidence = Math.min(1, rawConfidence + bonus)

    // 🔒 persistence (미세 하락 방지)
    if (uiConfidence < lastUiConfidenceRef.current) {
      return lastUiConfidenceRef.current
    }

    lastUiConfidenceRef.current = uiConfidence
    return uiConfidence
  }, [live, rawConfidence])
}
