'use client'

import { motion } from 'framer-motion'

type Props = {
  btcPrice: number
  avoidedExtremeCount: number
  avoidedLossUSD: number
}

export default function VIPTopKPIBar({
  btcPrice,
  avoidedExtremeCount,
  avoidedLossUSD,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="
        sticky top-0 z-40
        bg-black/80 backdrop-blur
        border-b border-neutral-800
      "
    >
      {/* =========================
          📱 Mobile Compact KPI
      ========================= */}
      <div className="md:hidden px-4 py-2 text-sm flex items-center justify-between text-neutral-300">
        <span>
          BTC{' '}
          <strong className="text-white">
            {btcPrice > 0 ? `$${btcPrice.toLocaleString()}` : '-'}
          </strong>
        </span>

        <span className="text-green-400">
          회피 {avoidedExtremeCount}회
        </span>

        <span className="text-yellow-400">
          +${avoidedLossUSD.toLocaleString()}
        </span>
      </div>

      {/* =========================
          🖥 Desktop KPI Cards
      ========================= */}
      <div className="hidden md:grid max-w-7xl mx-auto grid-cols-3 gap-4 px-4 py-3">
        {/* 현재 BTC 가격 */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <p className="text-xs text-neutral-400">
            현재 BTC 가격
          </p>
          <p className="text-2xl font-bold text-white">
            {btcPrice > 0
              ? `$${btcPrice.toLocaleString()}`
              : '-'}
          </p>
        </div>

        {/* 오늘 회피한 고위험 시나리오 */}
        <div className="bg-green-950/40 border border-green-800 rounded-xl p-4">
          <p className="text-xs text-green-400">
            오늘 회피한 고위험 시나리오
          </p>
          <p className="text-2xl font-bold text-green-300">
            {avoidedExtremeCount}회
          </p>
        </div>

        {/* VIP가 피한 추정 손실 */}
        <div className="bg-yellow-950/40 border border-yellow-800 rounded-xl p-4">
          <p className="text-xs text-yellow-400">
            VIP가 피한 추정 손실
          </p>
          <p className="text-2xl font-bold text-yellow-300">
            +${avoidedLossUSD.toLocaleString()}
          </p>
        </div>
      </div>
    </motion.div>
  )
}
