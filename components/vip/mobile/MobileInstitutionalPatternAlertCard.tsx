// components/vip/mobile/MobileInstitutionalPatternAlertCard.tsx

'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'

import { useFinalizedInstitutionalSnapshot } from '@/lib/market/institutional/useFinalizedInstitutionalSnapshot'

import {
  useInstitutionalEvidenceStore1h,
} from '@/lib/market/institutional/institutionalEvidenceStore1h'

import {
  buildInstitutionalConfirmation1h,
} from '@/lib/market/institutional/buildInstitutionalConfirmation1h'

import {
  detectInstitutionalPattern,
  type InstitutionalPatternIntensity,
  type InstitutionalPatternRisk,
} from '@/lib/market/patterns/detectInstitutionalPattern'

const riskClassMap: Record<
  InstitutionalPatternRisk,
  string
> = {
  LOW: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',

  MEDIUM:
    'border-amber-500/20 bg-amber-500/10 text-amber-300',

  HIGH: 'border-red-500/20 bg-red-500/10 text-red-300',
}

const intensityClassMap: Record<
  InstitutionalPatternIntensity,
  string
> = {
  WEAK: 'text-zinc-500',
  BUILDING: 'text-amber-300',
  AGGRESSIVE: 'text-orange-300',
  EXTREME: 'text-red-300',
}

const confidenceDescriptionMap: Record<
  InstitutionalPatternRisk,
  string
> = {
  LOW:
    '최근 30분 데이터 기준, 신호는 유효하지만 변동성 위험도 함께 존재합니다.',

  MEDIUM:
    '최근 30분 누적 데이터 기준, 신뢰 가능한 흐름이 감지되고 있습니다.',

  HIGH:
    '최근 30분 누적 데이터 기준, 높은 신뢰도의 세력 흐름이 감지되고 있습니다.',
}

export function MobileInstitutionalPatternAlertCard() {
  const finalized =
    useFinalizedInstitutionalSnapshot()

  const snapshot1h =
    useInstitutionalEvidenceStore1h(
      (state) => state.snapshot,
    )

  const pattern = useMemo(() => {
    if (!finalized.snapshotReady) {
      return null
    }

    const detected =
      detectInstitutionalPattern({
        snapshotReady: finalized.snapshotReady,

        oiDeltaAverage:
          finalized.oiDeltaAverage,

        oiDeltaAccum:
          finalized.oiDeltaAccum,

        oiDirectionalPersistenceAverage:
          finalized.oiDirectionalPersistenceAverage,

        fundingAverage:
          finalized.fundingAverage,

        fundingState:
          finalized.fundingState,

        volumeRatioAverage:
          finalized.volumeRatioAverage,

        volumeState:
          finalized.volumeState,

        whaleIntensityAverage:
          finalized.whaleIntensityAverage,

        whaleBias:
          finalized.whaleBias,

        whaleBuyPressure:
          finalized.whaleBuyPressure,

        whaleSellPressure:
          finalized.whaleSellPressure,

        longLiquidationPressure:
          finalized.longLiquidationPressure,

        shortLiquidationPressure:
          finalized.shortLiquidationPressure,

        dominantFlow:
          finalized.dominantFlow,

        oiDirectionalPressure:
          finalized.oiDirectionalPressure,

        fmaiDirectionalPressure:
          finalized.fmaiDirectionalPressure,

        absorptionAccum:
          finalized.absorptionAccum,

        absorptionAverage:
          finalized.absorptionAverage,

        sweepAccum:
          finalized.sweepAccum,

        sweepAverage:
          finalized.sweepAverage,

        institutionalEvents:
          finalized.institutionalEvents,
      })

    if (!detected || detected.type === 'NONE') {
      return null
    }

    const confirmation1h =
      buildInstitutionalConfirmation1h(
        detected.type,
        snapshot1h,
      )

    if (
      confirmation1h.action === 'BLOCK' ||
      confirmation1h.action === 'WATCH'
    ) {
      return null
    }

    return detected
  }, [finalized, snapshot1h])

  if (!pattern || pattern.type === 'NONE') {
    return null
  }

  const primaryMetric =
    pattern.metrics[0]

  const secondaryMetric =
    pattern.metrics[1]

  return (
    <motion.section
      layout
      initial={{
        opacity: 0,
        y: 10,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.25,
        ease: 'easeOut',
      }}
      className="
        relative
        overflow-hidden
        rounded-2xl
        border
        border-zinc-800
        bg-zinc-950/85
        p-4
      "
    >
      <div
        aria-hidden
        className="
          pointer-events-none
          absolute
          inset-x-0
          top-0
          h-px
          bg-gradient-to-r
          from-transparent
          via-zinc-400/25
          to-transparent
        "
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div
              className="
                text-[10px]
                font-semibold
                uppercase
                tracking-[0.16em]
                text-zinc-500
              "
            >
              Pattern Alert(패턴 감지)
            </div>

            <div
              className="
                mt-1
                truncate
                text-sm
                font-semibold
                text-white
              "
            >
              {pattern.title}
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1">
            <div
              className={`
                rounded-lg
                border
                px-2
                py-1
                text-[10px]
                font-semibold
                ${riskClassMap[pattern.risk]}
              `}
            >
              {pattern.risk}
            </div>

            <div
              className={`
                text-[10px]
                font-semibold
                ${intensityClassMap[pattern.intensity]}
              `}
            >
              {pattern.intensity}
            </div>
          </div>
        </div>

        <div
          className="
            mt-3
            text-xs
            leading-relaxed
            text-zinc-400
          "
        >
          {pattern.summary}
        </div>

        {(primaryMetric ||
          secondaryMetric) && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {primaryMetric && (
              <div
                className="
                  rounded-xl
                  border
                  border-zinc-800
                  bg-black/20
                  px-3
                  py-3
                "
              >
                <div
                  className="
                    text-[10px]
                    uppercase
                    tracking-[0.14em]
                    text-zinc-500
                  "
                >
                  {primaryMetric.label}
                </div>

                <div
                  className="
                    mt-2
                    text-sm
                    font-semibold
                    text-zinc-100
                  "
                >
                  {primaryMetric.value}
                </div>

                <div
                  className="
                    mt-1
                    text-[10px]
                    leading-relaxed
                    text-zinc-500
                  "
                >
                  {primaryMetric.note}
                </div>
              </div>
            )}

            {secondaryMetric && (
              <div
                className="
                  rounded-xl
                  border
                  border-zinc-800
                  bg-black/20
                  px-3
                  py-3
                "
              >
                <div
                  className="
                    text-[10px]
                    uppercase
                    tracking-[0.14em]
                    text-zinc-500
                  "
                >
                  {secondaryMetric.label}
                </div>

                <div
                  className="
                    mt-2
                    text-sm
                    font-semibold
                    text-zinc-100
                  "
                >
                  {secondaryMetric.value}
                </div>

                <div
                  className="
                    mt-1
                    text-[10px]
                    leading-relaxed
                    text-zinc-500
                  "
                >
                  {secondaryMetric.note}
                </div>
              </div>
            )}
          </div>
        )}

        <div
          className="
            mt-4
            flex
            items-center
            justify-start
            text-[10px]
            text-zinc-500
          "
        >
          <span>
            {
              confidenceDescriptionMap[
                pattern.risk
              ]
            }
          </span>
        </div>
      </div>
    </motion.section>
  )
}
