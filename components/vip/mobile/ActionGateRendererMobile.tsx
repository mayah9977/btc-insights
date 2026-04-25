'use client'

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BollingerSignalType } from '@/lib/market/actionGate/signalType'
import type { FinalNarrativeReport } from '@/lib/market/narrative/types'

import { useTypewriter } from '@/hooks/useTypewriter'
import { usePremiumSignalAnimation } from '@/hooks/usePremiumSignalAnimation'

export type ActionGateState =
  | 'OBSERVE'
  | 'CAUTION'
  | 'IGNORE'

interface Props {
  gate: ActionGateState
  signalType?: BollingerSignalType
  sentence: FinalNarrativeReport | null
}

export default function ActionGateRendererMobile({
  gate,
  signalType,
  sentence,
}: Props) {
  const title = 'Whales dominate the market.'

  const description =
    '현재 실시간데이터(고래움직임/체결량/온체인데이터/ Open Interest/Funding rate 등)를 기반으로 시장상황을 관찰중에 있습니다.'

  const bg =
    gate === 'OBSERVE'
      ? 'bg-emerald-900/20 border-emerald-600/30'
      : gate === 'CAUTION'
      ? 'bg-yellow-900/20 border-yellow-600/30'
      : 'bg-red-900/20 border-red-600/30'

  /* =========================
     🔥 기존 glow 유지
  ========================= */
  const stateGlow =
    gate === 'OBSERVE'
      ? 'shadow-[0_0_24px_rgba(16,185,129,0.18)] hover:shadow-[0_0_32px_rgba(16,185,129,0.26)]'
      : gate === 'CAUTION'
      ? 'shadow-[0_0_28px_rgba(245,158,11,0.22)] hover:shadow-[0_0_36px_rgba(245,158,11,0.30)]'
      : 'shadow-[0_0_32px_rgba(239,68,68,0.28)] hover:shadow-[0_0_42px_rgba(239,68,68,0.38)]'

  /* =========================
     🔥 NEW: SystemRiskBadge 스타일 (핵심)
  ========================= */
  const stateGlowStrong =
    gate === 'OBSERVE'
      ? 'shadow-[0_0_28px_rgba(16,185,129,0.22)]'
      : gate === 'CAUTION'
      ? 'shadow-[0_0_36px_rgba(245,158,11,0.26)]'
      : 'shadow-[0_0_48px_rgba(239,68,68,0.32)]'

  const statePulse =
    gate === 'OBSERVE'
      ? '' // ❌ pulse 없음
      : gate === 'CAUTION'
      ? 'animate-[pulse_3.2s_ease-in-out_infinite] opacity-80'
      : '' // ❌ IGNORE pulse 제거 (조건 반영)

  const [open, setOpen] = useState(false)
  const toggle = useCallback(() => setOpen(prev => !prev), [])

  const { flash, pulse, transition } =
    usePremiumSignalAnimation(signalType)

  const typedSummary = useTypewriter(
    sentence?.summary ?? '',
    10
  )

  const typedDescription = useTypewriter(
    sentence?.description ?? '',
    8
  )

  const typedTendency = useTypewriter(
    sentence?.tendency ?? '',
    12
  )

  const teaser =
    '우리는 “가격”이 아니라 “청산”을 맞춰야 한다'

  const why =
    ' 고래는 “가격을 움직이는 존재”가 아니라 “청산을 설계해서 돈을 버는 존재”입니다'

  const how =
    '"확정된 분석"은 현재 비트코인 시장의 구조와 자금 흐름의 압력으로 해석해서 활용하시길 바랍니다.'

  return (
    <div className="space-y-3">
      <motion.div
        onClick={toggle}
        whileTap={{ scale: 0.985 }}
        transition={{ duration: 0.2 }}
        className={`
          relative
          overflow-hidden
          rounded-xl
          border
          px-4
          py-4
          text-sm
          cursor-pointer
          transition-all
          duration-300
          ${bg}
          ${stateGlow} ${stateGlowStrong}   // 🔥 NEW 적용
        `}
      >
        {/* =========================
           🔥 기존 gradient flow 유지
        ========================= */}
        <motion.div
          aria-hidden
          initial={{ x: '-20%' }}
          animate={{ x: '20%' }}
          transition={{
            duration: 7,
            ease: 'linear',
            repeat: Infinity,
          }}
          className="
            pointer-events-none
            absolute
            inset-0
            opacity-[0.06]
            blur-xl
          "
        >
          <div
            className="
              w-[160%] h-full
              bg-gradient-to-r
              from-transparent
              via-white/20
              to-transparent
              skew-x-[-20deg]
            "
          />
        </motion.div>

        {/* =========================
           🔥 FIX: pulse를 background에만 적용
        ========================= */}
        <div
          aria-hidden
          className={`
            pointer-events-none
            absolute
            inset-0
            rounded-xl
            ${statePulse}   // 🔥 NEW
          `}
        >
          <div
            className={`
              absolute inset-0 rounded-xl
              ${gate === 'OBSERVE' ? 'bg-emerald-400/5' : ''}
              ${gate === 'CAUTION' ? 'bg-amber-400/6' : ''}
              ${gate === 'IGNORE' ? 'bg-red-400/7' : ''}
            `}
          />
        </div>

        <div className="relative z-10">
          <div className="mb-2 flex items-center justify-between">
            <div className="font-semibold text-white">
              {title}
            </div>

            <motion.div
              animate={{ rotate: open ? 180 : 0 }}
              transition={{ duration: 0.25 }}
              className="text-gray-400 text-xs"
            >
              ▼
            </motion.div>
          </div>

          {!open && (
            <div>
              <div className="text-gray-300 leading-relaxed">
                {teaser}
              </div>

              <div className="mt-1 text-[11px] text-gray-500">
                분석 해석 기준 보기
              </div>
            </div>
          )}

          <AnimatePresence initial={false}>
            {open && (
              <motion.div
                initial={{ height: 0, opacity: 0, y: -6 }}
                animate={{ height: 'auto', opacity: 1, y: 0 }}
                exit={{ height: 0, opacity: 0, y: -6 }}
                transition={{ duration: 0.28 }}
                className="overflow-hidden"
              >
                <div className="mt-3 space-y-3 text-xs leading-relaxed">
                  <div className="text-gray-300">
                    시스템은{' '}
                    <span className="font-semibold text-emerald-400">
                      OI
                    </span>
                    ,{' '}
                    <span className="font-semibold text-emerald-400">
                      Funding
                    </span>
                    ,{' '}
                    <span className="font-semibold text-emerald-400">
                      Volume
                    </span>
                    ,{' '}
                    <span className="font-semibold text-emerald-400">
                      Whale
                    </span>{' '}
                    의 흐름을 실시간으로 감지하고 있습니다.
                  </div>

                  <div className="text-white/90">
                    <span className="mr-1 font-semibold text-blue-400">
                      ✔ Why :
                    </span>
                    {why}
                  </div>

                  <div className="text-gray-300">
                    <span className="mr-1 font-semibold text-yellow-400">
                      ✔ How :
                    </span>
                    {how}
                  </div>

                  <div className="pt-2 text-center text-[11px] text-gray-500">
                    Confirmed analysis results ↓
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {sentence && (
        <div className="relative">
          {flash && (
            <div className="absolute inset-0 bg-yellow-500/20 animate-pulse rounded-xl pointer-events-none" />
          )}

          <div
            className={`
              rounded-xl
              border
              border-zinc-800
              bg-zinc-900
              px-4
              py-4
              text-sm
              space-y-2
              transition-all
              duration-500
              ${pulse ? 'animate-pulse' : ''}
              ${transition ? 'scale-[1.02]' : ''}
            `}
          >
            <div className="text-yellow-400 font-semibold">
              {typedSummary}
            </div>

            <div className="text-gray-300 text-xs leading-relaxed">
              {typedDescription}
            </div>

            <div className="text-gray-500 text-xs">
              {typedTendency}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
