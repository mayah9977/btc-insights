// components/market/patterns/InstitutionalPatternAlertCard.tsx

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

export function InstitutionalPatternAlertCard() {
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

    const confirmationSnapshot1h =
      snapshot1h?.confirmedCandleTs ===
      finalized.confirmedCandleTs
        ? snapshot1h
        : null

    const confirmation1h =
      buildInstitutionalConfirmation1h(
        detected.type,
        confirmationSnapshot1h,
      )

    console.log(
      '[DESKTOP_PATTERN_CARD_DISPLAY_CHECK]',
      {
        ts: Date.now(),
        confirmedCandleTs:
          finalized.confirmedCandleTs,
        snapshot1hConfirmedCandleTs:
          snapshot1h?.confirmedCandleTs,
        confirmationSnapshotMatched:
          snapshot1h?.confirmedCandleTs ===
          finalized.confirmedCandleTs,
        detectedType:
          detected.type,
        confirmationAction:
          confirmation1h.action,
        confirmationReason:
          confirmation1h.reason,
        dedupeKey:
          `${detected.type}:${finalized.confirmedCandleTs}`,
      },
    )

    if (confirmation1h.action !== 'ALLOW') {
      return null
    }

    return detected
  }, [
    finalized.snapshotReady,
    finalized.confirmedCandleTs,
    finalized.sampleCount,
    finalized.oiDeltaAverage,
    finalized.oiDeltaAccum,
    finalized.oiDirectionalPersistenceAverage,
    finalized.fundingAverage,
    finalized.fundingState,
    finalized.volumeRatioAverage,
    finalized.volumeState,
    finalized.whaleIntensityAverage,
    finalized.whaleBias,
    finalized.whaleBuyPressure,
    finalized.whaleSellPressure,
    finalized.longLiquidationPressure,
    finalized.shortLiquidationPressure,
    finalized.dominantFlow,
    finalized.oiDirectionalPressure,
    finalized.fmaiDirectionalPressure,
    finalized.absorptionAccum,
    finalized.absorptionAverage,
    finalized.sweepAccum,
    finalized.sweepAverage,
    finalized.institutionalEvents.whaleBurstCount,
    finalized.institutionalEvents.longAggressionDuration,
    finalized.institutionalEvents.shortAggressionDuration,
    finalized.institutionalEvents.longAggressionPersistence,
    finalized.institutionalEvents.shortAggressionPersistence,
    finalized.institutionalEvents.fundingOverheatDuration,
    finalized.institutionalEvents.oiExpansionEventCount,
    finalized.institutionalEvents.whaleAbsorptionCount,
    finalized.institutionalEvents.liquiditySweepCount,
    finalized.institutionalEvents.volatilityShockCount,
    snapshot1h?.confirmedCandleTs,
    snapshot1h?.sampleCount,
    snapshot1h?.oiDeltaAverage,
    snapshot1h?.oiDeltaAccum,
    snapshot1h?.dominantFlow,
    snapshot1h?.whaleBias,
    snapshot1h?.volumeState,
    snapshot1h?.fundingState,
    snapshot1h?.oiDirectionalPressure,
    snapshot1h?.fmaiDirectionalPressure,
  ])

  if (!pattern || pattern.type === 'NONE') {
    return null
  }

  return (
    <motion.section
      layout
      initial={{
        opacity: 0,
        y: 18,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.32,
        ease: 'easeOut',
      }}
      className="
        relative
        overflow-hidden
        rounded-3xl
        border
        border-zinc-800
        bg-gradient-to-br
        from-zinc-950
        to-zinc-900
        p-6
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
          via-zinc-400/30
          to-transparent
        "
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-5">
          <div>
            <div
              className="
                text-[11px]
                font-semibold
                uppercase
                tracking-[0.2em]
                text-zinc-500
              "
            >
              Institutional Pattern Detection
            </div>

            <h3
              className="
                mt-3
                text-2xl
                font-semibold
                tracking-tight
                text-white
              "
            >
              {pattern.title}
            </h3>

            <p
              className="
                mt-3
                max-w-3xl
                text-sm
                leading-relaxed
                text-zinc-400
              "
            >
              {pattern.summary}
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-2">
            <div
              className={`
                rounded-xl
                border
                px-3
                py-1.5
                text-xs
                font-semibold
                ${riskClassMap[pattern.risk]}
              `}
            >
              {pattern.risk}
            </div>

            <div
              className={`
                text-xs
                font-semibold
                ${intensityClassMap[pattern.intensity]}
              `}
            >
              {pattern.intensity}
            </div>

            <div className="text-xs text-zinc-500">
              {pattern.confidencePercent}%
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
          {pattern.reasons.map((reason) => (
            <div
              key={reason}
              className="
                rounded-2xl
                border
                border-zinc-800
                bg-black/20
                px-4
                py-3
                text-sm
                leading-relaxed
                text-zinc-300
              "
            >
              {reason}
            </div>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
          {pattern.metrics.map((metric) => (
            <div
              key={`${metric.label}-${metric.value}`}
              className="
                rounded-2xl
                border
                border-zinc-800
                bg-zinc-950/50
                px-4
                py-4
              "
            >
              <div
                className="
                  text-[11px]
                  uppercase
                  tracking-[0.18em]
                  text-zinc-500
                "
              >
                {metric.label}
              </div>

              <div
                className="
                  mt-3
                  text-lg
                  font-semibold
                  text-zinc-100
                "
              >
                {metric.value}
              </div>

              <div
                className="
                  mt-2
                  text-xs
                  leading-relaxed
                  text-zinc-500
                "
              >
                {metric.note}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  )
}
