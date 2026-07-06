// components/market/interpretation/ActionGateRenderer.tsx

'use client'

import React, {
  useEffect,
  useRef,
} from 'react'

import {
  motion,
  AnimatePresence,
} from 'framer-motion'

import { ActionGateCopy } from './ActionGateCopy'
import { ActionGateDescriptionHero } from './ActionGateDescriptionHero'

import { LiveBollingerCommentaryBanner } from '@/components/realtime/LiveBollingerCommentaryBanner'

import { BollingerSignalType } from '@/lib/market/actionGate/signalType'

import { generateNarrativeFromSnapshot } from '@/lib/market/narrative/generateNarrative'
import { buildMetaKey } from '@/lib/market/narrative/metaKeyBuilder'

import { useVIPMarketStore } from '@/lib/market/store/vipMarketStore'

import { useInstitutionalEvidenceStore } from '@/lib/market/institutional/institutionalEvidenceStore'
import { useFinalizedInstitutionalSnapshot } from '@/lib/market/institutional/useFinalizedInstitutionalSnapshot'
import {
  useRealtimeInstitutionalPatternStore,
} from '@/lib/market/institutional/realtimeInstitutionalPatternStore'

import { InstitutionalPatternAlertCard } from '@/components/market/patterns/InstitutionalPatternAlertCard'

import { FinalizedInstitutionalNumbers } from '@/components/market/interpretation/finalized/FinalizedInstitutionalNumbers'

interface ActionGateRendererProps {
  signalType?: BollingerSignalType
}

export const ActionGateRenderer: React.FC<
  ActionGateRendererProps
> = ({ signalType }) => {
  const finalized =
    useFinalizedInstitutionalSnapshot()

  const finalizedConfirmedCandleTs =
    finalized.confirmedCandleTs ?? 0

  const realtimePattern =
    useRealtimeInstitutionalPatternStore(
      (state) => state.pattern,
    )

  const gate = useVIPMarketStore(
    (s) => s.actionGateState,
  )

  const sentence = useVIPMarketStore(
    (s) => s.narrative,
  )

  const setNarrative = useVIPMarketStore(
    (s) => s.setNarrative,
  )

  const institutionalSnapshot =
    useInstitutionalEvidenceStore(
      (s) => s.snapshot,
    )

  const prevMetaKeyRef =
    useRef<string>('')

  useEffect(() => {
    if (!signalType) {
      return
    }

    const narrativeSnapshot =
      institutionalSnapshot ??
      (
        finalized.snapshotReady
          ? finalized
          : null
      )

    if (!narrativeSnapshot) {
      return
    }

    try {
      const snapshot =
        narrativeSnapshot

      if (
        !snapshot ||
        snapshot.sampleCount === 0
      ) {
        return
      }

      const metaKey = buildMetaKey(
        snapshot as any,
      )

      if (
        metaKey ===
        prevMetaKeyRef.current
      ) {
        return
      }

      prevMetaKeyRef.current =
        metaKey

      const newNarrative =
        generateNarrativeFromSnapshot(
          snapshot as any,
          signalType,
        )

      setNarrative(
        signalType,
        newNarrative,
        metaKey,
      )
    } catch (err) {
      console.error(
        'Narrative Flow Error:',
        err,
      )
    }
  }, [
    institutionalSnapshot,
    finalized,
    finalized.snapshotReady,
    finalized.confirmedCandleTs,
    finalized.sampleCount,
    signalType,
    setNarrative,
    sentence,
  ])

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

  const shouldShowRealtimePatternBeforeFinalized =
    Boolean(
      realtimePattern &&
        (
          !finalized.snapshotReady ||
          realtimePattern.confirmedCandleTs >
            finalizedConfirmedCandleTs
        ),
    )

  const shouldShowPatternSection =
    finalized.snapshotReady ||
    shouldShowRealtimePatternBeforeFinalized

  const shouldShowFinalizedAnalysisSection =
    Boolean(sentence) ||
    finalized.snapshotReady

  const displaySentence =
    sentence ??
    (
      finalized.snapshotReady
        ? {
            summary:
              'Finalized Data Analysis',
            description: [
              '확정된 30분/1시간 시장 데이터를 기준으로 기관 흐름, 고래 개입 강도, 거래량 압력, 펀딩 상태를 분석합니다.',
            ],
            tendency:
              '확정 데이터 기반 시장 압력 분석',
          }
        : null
    )

  const descriptionText =
    displaySentence
      ? Array.isArray(
          displaySentence.description,
        )
        ? displaySentence.description.join(
            '\n',
          )
        : displaySentence.description
      : ''

  return (
    <div
      className={`
        relative
        w-full
        flex
        items-stretch
        overflow-hidden
        border-b
        bg-gradient-to-r
        backdrop-blur-md
        transition-all
        duration-500
        ease-out
        ${containerClass}
        ${densityClass[gate]}
      `}
    >
      <div
        aria-hidden
        className={`
          absolute
          inset-0
          pointer-events-none
          transition-opacity
          duration-500
          ease-out
          ${bgMotionClass[gate] ?? 'ag-bg-default'}
        `}
      />

      <div
        className={`
          relative
          z-10
          w-[4px]
          shrink-0
          ${railClass}
        `}
      />

      <div
        className="
          relative
          z-10
          mx-auto
          flex
          w-full
          max-w-7xl
          flex-col
          justify-center
          px-6
          py-6
        "
      >
        <ActionGateCopy gate={gate} />

        <AnimatePresence mode="wait">
          {shouldShowFinalizedAnalysisSection && displaySentence && (
            <motion.div
              key={signalType}
              initial={{
                opacity: 0,
                y: 25,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: -15,
              }}
              transition={{
                duration: 0.45,
                ease: 'easeOut',
              }}
              className="mt-8"
            >
              {!shouldShowPatternSection ? (
                <motion.section
                  layout
                  transition={{
                    duration: 0.3,
                    ease: 'easeOut',
                  }}
                  className="
                    mt-6
                    space-y-6
                  "
                >
                  <div className="rounded-2xl border border-zinc-800 bg-black/20 px-5 py-4 text-sm leading-relaxed text-zinc-400">
                    확정 데이터 수집 중입니다. 첫 번째 30분 확정 분석 이후 수치가 표시됩니다.
                  </div>
                </motion.section>
              ) : (
                <>
                  <motion.div
                    className="
                      bg-gradient-to-r
                      from-yellow-300
                      via-amber-400
                      to-yellow-500
                      bg-clip-text
                      text-lg
                      font-semibold
                      tracking-wide
                      text-transparent
                      md:text-xl
                    "
                  >
                    {displaySentence.summary}
                  </motion.div>

                  <div className="mt-6">
                    <ActionGateDescriptionHero
                      description={
                        descriptionText
                      }
                      signalType={
                        signalType
                      }
                    />
                  </div>

                  <motion.div
                    initial={{
                      opacity: 0,
                    }}
                    animate={{
                      opacity: 1,
                    }}
                    transition={{
                      delay: 0.25,
                      duration: 0.35,
                    }}
                    className="
                      mt-6
                      inline-block
                      rounded-xl
                      border
                      border-emerald-400/30
                      bg-gradient-to-r
                      from-emerald-500/20
                      to-teal-500/20
                      px-5
                      py-2
                      text-lg
                      font-semibold
                      tracking-wide
                      text-emerald-300
                    "
                  >
                    {displaySentence.tendency}
                  </motion.div>

                  <motion.section
                    layout
                    transition={{
                      duration: 0.3,
                      ease: 'easeOut',
                    }}
                    className="
                      mt-6
                      space-y-6
                    "
                  >
                    <InstitutionalPatternAlertCard />
                  </motion.section>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {finalized.snapshotReady ? (
          <FinalizedInstitutionalNumbers />
        ) : null}

        <LiveBollingerCommentaryBanner />
      </div>
    </div>
  )
}
