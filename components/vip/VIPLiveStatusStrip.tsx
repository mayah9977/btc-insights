'use client'

import { motion } from 'framer-motion'
import type { RiskLevel } from '@/lib/vip/riskHistoryStore'

type Props = {
  riskLevel: RiskLevel
  lastTriggeredAt: number | null
  whaleWarning: {
    warning: any | null
  } | null
  volume: number | null
}

const RISK_COLOR: Record<RiskLevel, string> = {
  LOW: 'text-emerald-400',
  MEDIUM: 'text-yellow-400',
  HIGH: 'text-orange-400',
  EXTREME: 'text-red-500',
}

const RISK_LABEL: Record<RiskLevel, string> = {
  LOW: '시장 안정',
  MEDIUM: '변동성 증가',
  HIGH: '고위험 감지',
  EXTREME: '극단적 위험',
}

export default function VIPLiveStatusStrip({
  riskLevel,
  lastTriggeredAt,
  whaleWarning,
  volume,
}: Props) {
  const now = Date.now()

  const activeFor =
    lastTriggeredAt
      ? Math.max(0, Math.floor((now - lastTriggeredAt) / 1000))
      : null

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="
        border-b border-neutral-800
        bg-neutral-950/80 backdrop-blur
      "
    >
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs md:text-sm text-neutral-300">
        {/* 보호 상태 */}
        <div className="flex items-center gap-2">
          <span className="text-emerald-400">🛡</span>
          <span>VIP 보호 상태</span>
          <span className="font-semibold text-emerald-300">
            ACTIVE
          </span>
        </div>

        {/* 리스크 상태 */}
        <div className="flex items-center gap-2">
          <span className={RISK_COLOR[riskLevel]}>
            ⚠ {RISK_LABEL[riskLevel]}
          </span>
          {activeFor !== null && (
            <span className="text-neutral-500">
              ({activeFor}s 유지)
            </span>
          )}
        </div>

        {/* 고래 경보 */}
        <div className="flex items-center gap-2">
          <span>🐋</span>
          {whaleWarning?.warning ? (
            <span className="text-red-400 font-medium">
              고래 경보 감지
            </span>
          ) : (
            <span className="text-neutral-500">
              고래 이상 없음
            </span>
          )}
        </div>

        {/* 실시간 체결량 */}
        <div className="flex items-center gap-2">
          <span>📊</span>
          <span>
            체결량{' '}
            <strong className="text-white">
              {volume !== null
                ? `$${volume.toLocaleString()}`
                : '--'}
            </strong>
          </span>
        </div>
      </div>
    </motion.div>
  )
}
