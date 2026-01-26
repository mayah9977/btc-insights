'use client'

import { useEffect, useState } from 'react'

export type DailyAvoidedLossSummary = {
  todayAvoidedLossUSD: number
  yesterdayDeltaPercent: number | null
  extremeAvoidanceRate: number | null
}

/**
 * 📊 오늘 VIP 리스크 회피 요약 (숫자 기반)
 *
 * 역할:
 * - API 1회 호출
 * - 오늘 회피 손실 / 어제 대비 변화율 / EXTREME 회피 성공률 제공
 *
 * ❌ 문장 생성 ❌
 * ✅ 숫자 데이터만 반환
 */
export function useDailyAvoidedLossSummary() {
  const [state, setState] =
    useState<DailyAvoidedLossSummary | null>(null)

  useEffect(() => {
    let mounted = true

    fetch('/api/vip/daily-avoided-loss-summary')
      .then((res) => {
        if (!res.ok) return null
        return res.json()
      })
      .then((data) => {
        if (!mounted || !data) return

        setState({
          todayAvoidedLossUSD:
            Number(data.todayAvoidedLossUSD) || 0,

          yesterdayDeltaPercent:
            typeof data.yesterdayDeltaPercent === 'number'
              ? data.yesterdayDeltaPercent
              : null,

          extremeAvoidanceRate:
            typeof data.extremeAvoidanceRate === 'number'
              ? data.extremeAvoidanceRate
              : null,
        })
      })
      .catch(() => {
        // UX 우선: 조용히 실패
      })

    return () => {
      mounted = false
    }
  }, [])

  return state
}
