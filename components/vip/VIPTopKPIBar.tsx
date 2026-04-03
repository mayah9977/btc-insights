'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { useSystemGuideStore } from '@/lib/vip/systemGuideStore'
import VIPSystemGuideModal from './VIPSystemGuideModal'
import PriceTicker from './PriceTicker'

type Props = {
  avoidedExtremeCount: number
  avoidedLossUSD?: number
}

function VIPTopKPIBar({
  avoidedExtremeCount,
}: Props) {

  const openGuide = useSystemGuideStore(s => s.open)

  return (
    <>
      <div
        className="
          sticky top-0 z-40
          bg-black/80 backdrop-blur
          border-b border-neutral-800
        "
      >

        {/* =========================
           📱 Mobile Compact KPI
        ========================= */}

        <div className="md:hidden py-2 text-sm text-neutral-300 space-y-2">

          <div className="px-4">
            {/* Combined Card */}
            <div className="w-full rounded-xl border border-neutral-800 bg-neutral-900">
              <div className="px-4 py-3 space-y-3">

                {/* BTC 가격 */}
                <div className="flex items-center justify-between">
                  <span>
                    BTC price{' '}
                    <strong className="text-white">
                      <PriceTicker />
                    </strong>
                  </span>
                </div>

                {/* 버튼 영역 */}
                <div className="grid grid-cols-2 gap-2">

                  {/* 시스템 활용방법 */}
                  <motion.div
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.03 }}
                    animate={{
                      boxShadow: [
                        "0 0 6px rgba(34,197,94,0.2)",
                        "0 0 16px rgba(34,197,94,0.35)",
                        "0 0 6px rgba(34,197,94,0.2)"
                      ]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity
                    }}
                    onClick={() => openGuide('HOW_TO_USE')}
                    className="
                      cursor-pointer
                      rounded-xl
                      border border-green-700/40
                      bg-green-950/30
                      px-3 py-2
                      flex items-center justify-center
                      text-xs font-medium
                      text-green-400
                      backdrop-blur
                    "
                  >
                    시스템 활용방법
                  </motion.div>

                  {/* 시스템 설명 */}
                  <motion.div
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.03 }}
                    animate={{
                      boxShadow: [
                        "0 0 6px rgba(234,179,8,0.2)",
                        "0 0 16px rgba(234,179,8,0.35)",
                        "0 0 6px rgba(234,179,8,0.2)"
                      ]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity
                    }}
                    onClick={() => openGuide('DESCRIPTION')}
                    className="
                      cursor-pointer
                      rounded-xl
                      border border-yellow-700/40
                      bg-yellow-950/30
                      px-3 py-2
                      flex items-center justify-center
                      text-xs font-medium
                      text-yellow-400
                      backdrop-blur
                    "
                  >
                    시스템 설명
                  </motion.div>

                </div>

              </div>
            </div>
          </div>

        </div>

        {/* =========================
           🖥 Desktop KPI Cards
        ========================= */}

        <div className="hidden md:grid max-w-7xl mx-auto grid-cols-3 gap-4 px-4 py-3">

          {/* BTC 가격 */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
            <p className="text-xs text-neutral-400">
              현재 BTC 가격
            </p>

            <p className="text-2xl font-bold text-white">
              <PriceTicker />
            </p>
          </div>

          {/* 시스템 활용방법 */}
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

          {/* 시스템 설명 */}
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

      </div>

      <VIPSystemGuideModal />
    </>
  )
}

export default React.memo(VIPTopKPIBar)
