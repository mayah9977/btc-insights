'use client'

import React, { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ActionGateState } from '@/components/system/ActionGateStatus'

import { RiskNumericPanel } from './numeric/RiskNumericPanel'
import { RiskLimitedPanel } from './limited/RiskLimitedPanel'
import { RiskFullPanel } from './full/RiskFullPanel'
import { ActionGateCopy } from './ActionGateCopy'

import { LiveBollingerCommentaryBanner } from '@/components/realtime/LiveBollingerCommentaryBanner'
import { BOLLINGER_SENTENCE_MAP } from '@/lib/market/actionGate/bollingerSentenceMap'
import { BollingerSignalType } from '@/lib/market/actionGate/signalType'

/* 🔥 Hero 컴포넌트 */
import { ActionGateDescriptionHero } from './ActionGateDescriptionHero'

interface ActionGateRendererProps {
  gate: ActionGateState
  signalType?: BollingerSignalType
}

export const ActionGateRenderer: React.FC<ActionGateRendererProps> = ({
  gate,
  signalType,
}) => {
  /* ======================================================
     1️⃣ Container tone
  ====================================================== */

  const containerClass =
    gate === 'OBSERVE'
      ? 'from-emerald-900/40 to-teal-900/20 border-emerald-700/40 text-emerald-200 shadow-[0_0_40px_rgba(16,185,129,0.15)]'
      : gate === 'CAUTION'
      ? 'from-amber-900/30 to-yellow-900/20 border-amber-700/40 text-amber-200 shadow-[0_0_40px_rgba(245,158,11,0.15)]'
      : 'from-slate-900/60 to-neutral-900/40 border-slate-700/40 text-slate-300 shadow-[0_0_30px_rgba(100,116,139,0.12)]'

  const railClass =
    gate === 'OBSERVE'
      ? 'bg-emerald-400/40'
      : gate === 'CAUTION'
      ? 'bg-amber-400/40'
      : 'bg-slate-400/30'

  /* ======================================================
     2️⃣ SSOT Sentence
  ====================================================== */

  const sentence = useMemo(() => {
    if (!signalType) return null
    return BOLLINGER_SENTENCE_MAP[signalType]
  }, [signalType])

  /* ======================================================
     3️⃣ Background animation
  ====================================================== */

  const bgMotionClass: Partial<Record<ActionGateState, string>> = {
    OBSERVE: 'ag-bg-observe',
    CAUTION: 'ag-bg-caution',
    IGNORE: 'ag-bg-ignore',
  }

  const densityClass: Partial<Record<ActionGateState, string>> = {
    OBSERVE: 'ag-density-open',
    CAUTION: 'ag-density-medium',
    IGNORE: 'ag-density-compact',
  }

  return (
    <div
      className={`
        relative w-full flex items-stretch border-b
        bg-gradient-to-r backdrop-blur-md overflow-hidden
        transition-all duration-500 ease-out
        ${containerClass}
        ${densityClass[gate]}
      `}
    >
      {/* Animated Background */}
      <div
        aria-hidden
        className={`
          absolute inset-0 pointer-events-none
          transition-opacity duration-500 ease-out
          ${bgMotionClass[gate] ?? 'ag-bg-default'}
        `}
      />

      {/* Left Rail */}
      <div className={`relative z-10 w-[4px] shrink-0 ${railClass}`} />

      <div className="relative z-10 mx-auto max-w-7xl px-6 w-full flex flex-col justify-center py-6">

        {/* Header 영역 유지 */}
        <ActionGateCopy gate={gate} />

        {/* ======================================================
           🔥 HERO DESCRIPTION ZONE
        ====================================================== */}

        <AnimatePresence mode="wait">
          {sentence && (
            <motion.div
              key={signalType}
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.45 }}
              className="mt-8"
            >
              {/* SUMMARY */}
              <motion.div
                className="
                  text-lg md:text-xl
                  font-semibold
                  tracking-wide
                  bg-gradient-to-r
                  from-yellow-300
                  via-amber-400
                  to-yellow-500
                  bg-clip-text
                  text-transparent
                "
              >
                {sentence.summary}
              </motion.div>

              {/* 🔥 핵심: description → Hero로 완전 교체 */}
              <div className="mt-6">
                <ActionGateDescriptionHero
                  description={sentence.description}
                  signalType={signalType}
                />
              </div>

              {/* TENDENCY */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="
                  mt-6 inline-block px-5 py-2 rounded-xl
                  bg-gradient-to-r from-emerald-500/20 to-teal-500/20
                  border border-emerald-400/30
                  text-emerald-300 text-lg font-semibold tracking-wide
                "
              >
                {sentence.tendency}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live Commentary 유지 */}
        <LiveBollingerCommentaryBanner />

        {/* Structural Panels 유지 */}
        <div className="mt-4">
          {gate === 'IGNORE' && <RiskNumericPanel />}
          {gate === 'CAUTION' && <RiskLimitedPanel />}
          {gate === 'OBSERVE' && <RiskFullPanel />}
        </div>
      </div>
    </div>
  )
}
