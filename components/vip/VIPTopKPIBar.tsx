'use client'

import { motion } from 'framer-motion'
import { useSystemGuideStore } from '@/lib/vip/systemGuideStore'
import VIPSystemGuideModal from './VIPSystemGuideModal'

type Props = {
  btcPrice: number
  avoidedExtremeCount: number
  avoidedLossUSD: number // ⛔ 사용하지 않음 (호환성 유지)
}

export default function VIPTopKPIBar({
  btcPrice,
  avoidedExtremeCount,
}: Props) {
  const openGuide = useSystemGuideStore(s => s.open)

  return (
    <>
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

          <button
            onClick={() => openGuide('HOW_TO_USE')}
            className="text-green-400 hover:text-green-300 transition"
          >
            시스템 활용방법
          </button>

          <button
            onClick={() => openGuide('DESCRIPTION')}
            className="text-yellow-400 hover:text-yellow-300 transition"
          >
            시스템 설명
          </button>
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

          {/* 🔥 시스템 활용방법 (클릭 가능) */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => openGuide('HOW_TO_USE')}
            className="
              cursor-pointer
              bg-green-950/40
              border border-green-800
              hover:border-green-600
              transition
              rounded-xl p-4
            "
          >
            <p className="text-xs text-green-400">
              AI Risk Observation System (AI 기반 리스크 관측 시스템)
            </p>
            <p className="text-2xl font-bold text-green-300">
              시스템 활용방법
            </p>
          </motion.div>

          {/* 🔥 시스템 설명 및 주의사항 (클릭 가능) */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => openGuide('DESCRIPTION')}
            className="
              cursor-pointer
              bg-yellow-950/40
              border border-yellow-800
              hover:border-yellow-600
              transition
              rounded-xl p-4
            "
          >
            <p className="text-xs text-yellow-400">
              Probabilistic Risk Detection Model (확률적 위험 감지 모델)
            </p>
            <p className="text-2xl font-bold text-yellow-300">
              시스템 설명 및 유의사항
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* 🔥 모달 연결 */}
      <VIPSystemGuideModal />
    </>
  )
}
