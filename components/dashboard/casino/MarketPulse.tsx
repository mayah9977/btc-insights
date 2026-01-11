'use client'

import { motion } from 'framer-motion'
import { useVipOverviewStore } from '@/lib/vip/overviewStore'

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
 * - riskLevel 변경 시에만 미세한 긴장 애니메이션
 */
export default function MarketPulse() {
  const {
    riskLevel,
    warningCount30m,
    nextEvaluationMinutes,
  } = useVipOverviewStore()

  const tone = riskTone[riskLevel]

  return (
    <motion.section
      key={riskLevel}
      initial={{ opacity: 0.7, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="rounded-2xl border border-vipBorder bg-vipCard p-6 shadow-[0_20px_60px_rgba(0,0,0,0.6)] space-y-4"
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
    </motion.section>
  )
}
