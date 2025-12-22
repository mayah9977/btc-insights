'use client'

import { motion } from 'framer-motion'
import { useMemo } from 'react'
import {
  getExtremeHistory,
  getAverageReliability,
} from '@/lib/extreme/extremeHistoryStore'
import { VIP3PredictionAccuracyBadge } from '@/components/extreme/VIP3PredictionAccuracyBadge'

/**
 * 최근 Extreme 신뢰도 기반
 * 다음 Extreme 발생 확률 (UX 목적)
 */
function calcNextExtremeProbability(): number {
  const history = getExtremeHistory()
  if (history.length < 3) return 0.15

  const recent = history.slice(-5)
  const avg =
    recent.reduce((a, b) => a + b.reliability, 0) /
    recent.length

  // 신뢰도가 낮을수록 다음 Extreme 가능성 ↑
  return Math.min(0.95, Math.max(0.05, 1 - avg))
}

/**
 * Stable Zone 잔여 시간 (UX용 추정치, 초)
 */
function calcRemainingStableTime(avg: number): number {
  if (avg < 0.25) return 300 // 5m
  if (avg < 0.35) return 180 // 3m
  return 60 // 1m
}

function probabilityLabel(p: number) {
  if (p > 0.7) return 'High'
  if (p > 0.4) return 'Medium'
  return 'Low'
}

export function VIP3PredictionCard() {
  // 🔒 불필요한 재계산 방지
  const probability = useMemo(
    () => calcNextExtremeProbability(),
    []
  )
  const avgReliability = useMemo(
    () => getAverageReliability(),
    []
  )

  const percent = Math.round(probability * 100)
  const remaining = calcRemainingStableTime(
    avgReliability
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="
        border rounded-xl p-4
        bg-gradient-to-br
        from-fuchsia-900/40
        to-black
      "
    >
      {/* ============================= */}
      {/* HEADER: VIP3 + ACCURACY */}
      {/* ============================= */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-fuchsia-300 font-semibold">
          VIP3 PREDICTION
        </span>
        <VIP3PredictionAccuracyBadge />
      </div>

      <div className="space-y-3">
        {/* Next Extreme Odds */}
        <div>
          <div className="text-sm text-gray-400">
            Next Extreme Odds
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold">
              {percent}%
            </span>
            <span className="text-sm text-gray-400">
              ({probabilityLabel(probability)})
            </span>
          </div>
        </div>

        {/* Remaining Stable Zone */}
        <div>
          <div className="text-sm text-gray-400">
            Remaining Stable Zone
          </div>
          <div className="text-lg font-semibold">
            ~ {Math.floor(remaining / 60)}m{' '}
            {(remaining % 60)
              .toString()
              .padStart(2, '0')}
            s
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs text-gray-400">
        최근 Extreme 신뢰도 흐름을 기반으로 한
        단기 예측 지표입니다. (VIP3 전용)
      </p>
    </motion.div>
  )
}
