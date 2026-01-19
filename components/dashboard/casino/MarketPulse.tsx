'use client'

import { motion, useAnimation } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { useVipOverviewStore } from '@/lib/vip/overviewStore'
import MarketPulseRecentBadge from './MarketPulseRecentBadge'

const riskTone = {
  LOW: {
    emoji: '🟢',
    heat: '🔥',
    label: '조용한 흐름',
    desc: '시장은 비교적 안정적인 상태입니다.',
  },
  MEDIUM: {
    emoji: '🟡',
    heat: '🔥🔥',
    label: '움직임 감지',
    desc: '방향성 시도가 관찰되고 있습니다.',
  },
  HIGH: {
    emoji: '🟠',
    heat: '🔥🔥🔥',
    label: '긴장 구간',
    desc: '위험 신호가 반복적으로 발생 중입니다.',
  },
  EXTREME: {
    emoji: '🔴',
    heat: '🔥🔥🔥🔥',
    label: '과열 상태',
    desc: '짧은 시간에 강한 변동이 집중되고 있습니다.',
  },
} as const

/**
 * Market Pulse
 * - 계산 ❌
 * - 판단 ❌
 * - SSOT(overviewStore)에서 상태만 읽어 연출
 * - HIGH → EXTREME 전환 시 짧은 Visual Shock
 * - 최근 변화 배지(FOMO) 표시
 */
export default function MarketPulse() {
  const {
    riskLevel,
    warningCount30m,
    nextEvaluationMinutes,
  } = useVipOverviewStore()

  const tone = riskTone[riskLevel]
  const controls = useAnimation()
  const prevRisk = useRef<typeof riskLevel | null>(null)

  useEffect(() => {
    if (prevRisk.current === 'HIGH' && riskLevel === 'EXTREME') {
      // 🔥 Visual Shock (약 300ms)
      controls.start({
        scale: [1, 1.04, 0.98, 1],
        filter: ['blur(0px)', 'blur(2px)', 'blur(0px)'],
        transition: { duration: 0.35 },
      })
    }
    prevRisk.current = riskLevel
  }, [riskLevel, controls])

  return (
    <motion.section
      animate={controls}
      initial={{ opacity: 0.85 }}
      className="rounded-2xl border border-vipBorder bg-vipCard p-6
                 shadow-[0_20px_60px_rgba(0,0,0,0.6)] space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs tracking-widest uppercase text-zinc-400">
          Market Pulse
        </span>
        <span className="text-xs text-zinc-500">
          지금 이 순간의 시장 분위기
        </span>
      </div>

      {/* Core Mood */}
      <div className="space-y-1">
        <div className="text-2xl font-extrabold text-white">
          {tone.emoji} {tone.label}
        </div>
        <div className="text-sm text-zinc-400">
          {tone.desc}
        </div>
      </div>

      {/* Heat */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-zinc-400">
          위험 온도
        </span>
        <span className="text-lg">
          {tone.heat}
        </span>
      </div>

      {/* Activity */}
      <div className="text-sm text-zinc-400">
        최근 30분간{' '}
        <b className="text-zinc-200">
          {warningCount30m}
        </b>
        회 경고 신호 발생
      </div>

      {/* Time Pressure */}
      <div className="text-xs text-zinc-500">
        이 판단은{' '}
        <b className="text-zinc-300">
          {nextEvaluationMinutes}분 후
        </b>{' '}
        재평가됩니다
      </div>

      {/* 🔔 Recent Change Badge (FOMO) */}
      <MarketPulseRecentBadge />
    </motion.section>
  )
}
