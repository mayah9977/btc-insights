'use client'

import { useEffect, useRef, useState } from 'react'
import type { RiskLevel } from '@/lib/vip/riskEngine'

type Options = {
  settleDelayMs?: number
  onStableChange?: (level: RiskLevel) => void
}

const DEFAULT_DELAY = 3_000

export function useStableRiskLevel(
  realtimeRiskLevel: RiskLevel,
  options: Options = {},
): RiskLevel {
  const {
    settleDelayMs = DEFAULT_DELAY,
    onStableChange,
  } = options

  const [stableRiskLevel, setStableRiskLevel] =
    useState<RiskLevel>(realtimeRiskLevel)

  const pendingTimer = useRef<NodeJS.Timeout | null>(null)
  const lastRealtime = useRef<RiskLevel>(realtimeRiskLevel)
  const lastStable = useRef<RiskLevel>(realtimeRiskLevel)
  const hasInitialized = useRef(false)

  /**
   * ✅ 0️⃣ 최초 마운트 시 1회 확정 처리
   */
  useEffect(() => {
    if (hasInitialized.current) return
    hasInitialized.current = true

    lastStable.current = realtimeRiskLevel
    setStableRiskLevel(realtimeRiskLevel)
    onStableChange?.(realtimeRiskLevel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /**
   * ✅ 1️⃣ 실시간 Risk → Stable Risk 변환
   */
  useEffect(() => {
    if (realtimeRiskLevel === lastRealtime.current) return
    lastRealtime.current = realtimeRiskLevel

    // 🔥 EXTREME 은 즉시 확정
    if (realtimeRiskLevel === 'EXTREME') {
      if (pendingTimer.current) {
        clearTimeout(pendingTimer.current)
        pendingTimer.current = null
      }

      if (lastStable.current !== 'EXTREME') {
        lastStable.current = 'EXTREME'
        setStableRiskLevel('EXTREME')
        onStableChange?.('EXTREME')
      }
      return
    }

    // 기존 대기 취소
    if (pendingTimer.current) {
      clearTimeout(pendingTimer.current)
    }

    // 일정 시간 유지되면 확정
    pendingTimer.current = setTimeout(() => {
      if (lastStable.current !== realtimeRiskLevel) {
        lastStable.current = realtimeRiskLevel
        setStableRiskLevel(realtimeRiskLevel)
        onStableChange?.(realtimeRiskLevel)
      }
      pendingTimer.current = null
    }, settleDelayMs)

    return () => {
      if (pendingTimer.current) {
        clearTimeout(pendingTimer.current)
        pendingTimer.current = null
      }
    }
  }, [realtimeRiskLevel, settleDelayMs, onStableChange])

  return stableRiskLevel
}
