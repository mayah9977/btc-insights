'use client'

import { useEffect, useState } from 'react'

/**
 * 🔗 VIP 배너 전용 최신 RiskEvent 타입
 * - 서버 getLatestRiskEvent()와 1:1 매칭
 */
export type LatestRiskEvent = {
  riskLevel: 'HIGH' | 'EXTREME'
  reason: string | null
  timestamp: number
}

/**
 * 🔎 가장 최근 HIGH / EXTREME RiskEvent 조회
 *
 * 사용처:
 * - VIPNoEntryReasonBanner
 *
 * 정책:
 * - 서버 SSOT 결과 그대로 사용
 * - 실패 / 없음 → null (조용히)
 */
export function useLatestRiskEvent() {
  const [event, setEvent] =
    useState<LatestRiskEvent | null>(null)

  useEffect(() => {
    let mounted = true

    fetch('/api/vip/latest-risk')
      .then((res) => {
        if (!res.ok) return null
        return res.json()
      })
      .then((data) => {
        if (mounted && data) {
          setEvent(data)
        }
      })
      .catch(() => {
        // ❌ 에러 로깅하지 않음 (UX 우선)
      })

    return () => {
      mounted = false
    }
  }, [])

  return event
}
