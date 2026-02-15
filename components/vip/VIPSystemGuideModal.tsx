'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'
import { useSystemGuideStore } from '@/lib/vip/systemGuideStore'

export default function VIPSystemGuideModal() {
  const {
    isOpen,
    activeTab,
    close,
    setTab,
    markAsSeen,
    initialize,
  } = useSystemGuideStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4"
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-3xl bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
            <h2 className="text-lg font-semibold text-white">
              VIP 시스템 안내
            </h2>

            <button
              onClick={() => {
                markAsSeen()
                close()
              }}
              className="text-neutral-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-neutral-800">
            <button
              onClick={() => setTab('HOW_TO_USE')}
              className={`flex-1 py-3 text-sm font-medium ${
                activeTab === 'HOW_TO_USE'
                  ? 'bg-neutral-900 text-green-400'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              시스템 활용방법
            </button>

            <button
              onClick={() => setTab('DESCRIPTION')}
              className={`flex-1 py-3 text-sm font-medium ${
                activeTab === 'DESCRIPTION'
                  ? 'bg-neutral-900 text-yellow-400'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              시스템 설명 및 유의사항
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-6 text-sm text-neutral-300 leading-relaxed max-h-[65vh] overflow-y-auto space-y-6">
            {activeTab === 'HOW_TO_USE' && (
              <>
                <section>
                  <h3 className="text-green-400 font-semibold mb-2">
                    1️⃣ 시스템 정체성
                  </h3>
                  <p>
                    본 시스템은 실시간 고래 체결 강도, Open Interest,
                    Funding rate, 변동성, 추세 구조 등을 종합하여
                    시장의 위험 구간을 감지하는 리스크 관측 시스템입니다.
                  </p>
                </section>

                <section>
                  <h3 className="text-green-400 font-semibold mb-2">
                    2️⃣ 활용 방법
                  </h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>고래 체결 강도가 0.55 이상 상승 시 경계 구간 주의</li>
                    <li>0.7 이상 + Spike 발생 시 고위험 구간 주의</li>
                    <li>실시간데이터를 기반으로한 분석을 이용, 위험구간을 미리 감지해 포지션의 크기를 줄이는데 활용가능하다.</li>
                    <li>데이터를 기반으로 분석된 내용을 토대로 리스크가 적은 진입시점을 판단하는데 도움을 받을수 있다.</li>
                    <li>분석된 내용이 즉시 확인가능하므로, 시장상황의 리스크를 바로 감지할수 있다. </li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-green-400 font-semibold mb-2">
                    3️⃣ 전략적 사용
                  </h3>
                  <p>
                    본 시스템은 매수/매도 신호가 아닌
                    데이터를 기반으로 위험구간을 알려 사용자의 손실을 줄이는것을 목적으로 설계되었습니다. 
                  </p>
                </section>
              </>
            )}

            {activeTab === 'DESCRIPTION' && (
              <>
                <section>
                  <h3 className="text-yellow-400 font-semibold mb-2">
                    ⚠️ 시스템 설명
                  </h3>
                  <p>
                    본 시스템은 실시간 데이터 기반 확률적 위험 감지 모델입니다.
                    절대적인 예측 도구가 아닙니다.
                  </p>
                </section>

                <section>
                  <h3 className="text-yellow-400 font-semibold mb-2">
                    ⚠️ 사용 시 유의사항
                  </h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>시장은 예측 불가능한 요소를 포함합니다.</li>
                    <li>모든 투자 책임은 사용자 본인에게 있습니다.</li>
                    <li>단일 지표 의존은 위험합니다.</li>
                    <li>레버리지 사용 시 각별한 주의가 필요합니다.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-yellow-400 font-semibold mb-2">
                    📌 책임 고지
                  </h3>
                  <p>
                    본 서비스는 투자 자문이 아니며,
                    정보 제공 목적의 분석 시스템입니다.
                  </p>
                </section>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-neutral-800 px-6 py-4 flex justify-end">
            <button
              onClick={() => {
                markAsSeen()
                close()
              }}
              className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm"
            >
              이해했습니다
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
