// components/market/interpretation/ActionGateRenderer.tsx

'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import { ActionGateCopy } from './ActionGateCopy'

import { LiveBollingerCommentaryBanner } from '@/components/realtime/LiveBollingerCommentaryBanner'
import { BollingerSignalType } from '@/lib/market/actionGate/signalType'

import { generateNarrativeFromSnapshot } from '@/lib/market/narrative/generateNarrative'

import { useVIPMarketStore } from '@/lib/market/store/vipMarketStore'

import { ActionGateDescriptionHero } from './ActionGateDescriptionHero'

import { buildMetaKey } from '@/lib/market/narrative/metaKeyBuilder'
import { useEffect, useRef } from 'react'

import { useInstitutionalEvidenceStore } from '@/lib/market/institutional/institutionalEvidenceStore'

import { FinalizedInstitutionalNumbers } from '@/components/market/interpretation/finalized/FinalizedInstitutionalNumbers'

interface ActionGateRendererProps {
  signalType?: BollingerSignalType
}

export const ActionGateRenderer: React.FC<
  ActionGateRendererProps
> = ({ signalType }) => {
  const gate = useVIPMarketStore((s) => s.actionGateState)
  const sentence = useVIPMarketStore((s) => s.narrative)
  const setNarrative = useVIPMarketStore((s) => s.setNarrative)

  const institutionalSnapshot =
    useInstitutionalEvidenceStore(
      (s) => s.snapshot,
    )

  const prevMetaKeyRef = useRef<string>('')

  useEffect(() => {
    if (!signalType) return

    if (!institutionalSnapshot) return

    try {
      const snapshot = institutionalSnapshot

      if (
        !snapshot ||
        snapshot.sampleCount === 0
      ) {
        return
      }

      const metaKey = buildMetaKey(snapshot as any)

      if (metaKey === prevMetaKeyRef.current) return

      prevMetaKeyRef.current = metaKey

      const newNarrative = generateNarrativeFromSnapshot(
        snapshot as any,
        signalType,
      )

      setNarrative(signalType, newNarrative, metaKey)
    } catch (err) {
      console.error('Narrative Flow Error:', err)
    }
  }, [institutionalSnapshot, signalType, setNarrative])

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

  const bgMotionClass = {
    OBSERVE: 'ag-bg-observe',
    CAUTION: 'ag-bg-caution',
    IGNORE: 'ag-bg-ignore',
  }

  const densityClass = {
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
      <div
        aria-hidden
        className={`
          absolute inset-0 pointer-events-none
          transition-opacity duration-500 ease-out
          ${bgMotionClass[gate] ?? 'ag-bg-default'}
        `}
      />

      <div
        className={`relative z-10 w-[4px] shrink-0 ${railClass}`}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-6 w-full flex flex-col justify-center py-6">
        <ActionGateCopy gate={gate} />

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

              <div className="mt-6">
                <ActionGateDescriptionHero
                  description={sentence.description}
                  signalType={signalType}
                />
              </div>

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

              <FinalizedInstitutionalNumbers />
            </motion.div>
          )}
        </AnimatePresence>

        <LiveBollingerCommentaryBanner />
      </div>
    </div>
  )
}
