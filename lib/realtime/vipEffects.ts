// lib/realtime/vipEffects.ts

import { useVipJudgementStore } from '@/lib/vip/judgementStore'
import { useNotificationStore } from '@/lib/notification/notificationHistoryStore'
import type { RiskLevel } from '@/lib/vip/riskTypes'

// 🔥 Live Risk SSOT
import { useLiveRiskState } from '@/lib/realtime/liveRiskState'

// 🐋 Whale Effects
import {
  handleWhaleIntensityEffect,
  handleWhaleWarningEffect,
} from '@/lib/realtime/whaleEffects'

let lastRiskLevel: RiskLevel | null = null

/* =========================
 * 🔥 Risk Update (SSOT)
 * ========================= */
export function handleRiskUpdate(data: {
  riskLevel: RiskLevel
  ts: number
  judgement: string
  confidence: number
  whaleAccelerated?: boolean
}) {
  const {
    riskLevel,
    ts,
    judgement,
    confidence,
    whaleAccelerated,
  } = data

  /* 1️⃣ Live Risk State */
  useLiveRiskState.getState().update({
    level: riskLevel,
    ts,
    whaleAccelerated,
  })

  const judgementStore = useVipJudgementStore.getState()
  const notificationStore = useNotificationStore.getState()

  /* 2️⃣ Judgement SSOT 저장 */
  judgementStore.setJudgement({
    sentence: judgement,
    rawConfidence: confidence,
  })

  /* 3️⃣ Risk 변경 시에만 Side Effect */
  if (riskLevel !== lastRiskLevel) {
    const timeLabel = new Date(ts).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    })

    /* Timeline */
    judgementStore.append({
      time: timeLabel,
      state: `Risk ${riskLevel}`,
      note: judgement,
    })

    /* Notification */
    notificationStore.record({
      level:
        riskLevel === 'EXTREME'
          ? 'CRITICAL'
          : riskLevel === 'HIGH'
          ? 'WARNING'
          : 'INFO',
      message: judgement,
      at: ts,
    })

    lastRiskLevel = riskLevel
  }
}

/* =========================
 * 🐋 Whale Effects
 * ========================= */

export function handleWhaleIntensity(data: {
  symbol: string
  intensity: number
  avg: number
  trend: 'UP' | 'DOWN' | 'FLAT'
  isSpike: boolean
  riskLevel: RiskLevel
  ts: number
}) {
  handleWhaleIntensityEffect(data)
}

export function handleWhaleWarning(data: {
  symbol: string
  whaleIntensity: number
  avgWhale: number
  tradeUSD?: number
  ts: number
}) {
  handleWhaleWarningEffect(data)
}
