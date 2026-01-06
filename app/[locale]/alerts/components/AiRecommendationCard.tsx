'use client'

import { motion } from 'framer-motion'

export default function AiRecommendationCard({
  symbol,
  action,
  confidence,
}: {
  symbol: string
  action: '매수' | '매도' | '관망'
  confidence: number
}) {
  const color =
    action === '매수'
      ? 'from-emerald-500/40 to-emerald-500/5'
      : action === '매도'
      ? 'from-red-500/40 to-red-500/5'
      : 'from-gray-500/30 to-gray-500/5'

  return (
    <motion.div
      animate={{
        boxShadow: [
          '0 0 0 rgba(0,0,0,0)',
          '0 0 25px rgba(99,102,241,0.35)',
          '0 0 0 rgba(0,0,0,0)',
        ],
      }}
      transition={{
        duration: 2.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={`relative rounded-2xl p-6 bg-gradient-to-br ${color} border border-white/10`}
    >
      <div className="text-xs text-gray-400">AI 추천</div>
      <div className="mt-1 text-lg font-semibold">{symbol}</div>
      <div className="mt-2 text-3xl font-bold">{action}</div>
      <div className="mt-1 text-xs text-gray-400">
        신뢰도 {confidence}%
      </div>
    </motion.div>
  )
}
