// components/vip/mobile/MobileFinalizedInstitutionalNumbers.tsx

'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import { useFinalizedInstitutionalSnapshot } from '@/lib/market/institutional/useFinalizedInstitutionalSnapshot'

function formatNumber(
  value: number,
  digits = 2,
) {
  if (!Number.isFinite(value)) return '-'

  return value.toFixed(digits)
}

function formatPercent(
  value: number,
  digits = 4,
) {
  if (!Number.isFinite(value)) return '-'

  return `${(value * 100).toFixed(digits)}%`
}

type CardKey =
  | 'OI'
  | 'FUNDING'
  | 'VOLUME'
  | 'WHALE'

type MobileCardProps = {
  title: string
  value: string
  subtitle: string
  expanded: boolean
  onToggle: () => void
  accent: string
  description: string
  interpretation: string[]
}

function MobileExpandableCard({
  title,
  value,
  subtitle,
  expanded,
  onToggle,
  accent,
  description,
  interpretation,
}: MobileCardProps) {
  return (
    <motion.div
      layout
      className="
        rounded-xl
        border
        border-zinc-800
        bg-black/30
        overflow-hidden
      "
    >
      <button
        onClick={onToggle}
        className="
          relative
          w-full
          text-left
          px-3
          py-3
        "
      >
        <div
          className={`
            absolute inset-0 opacity-40
            ${accent}
          `}
        />

        <div className="relative z-10 flex items-start justify-between">
          <div>
            <div className="text-[10px] text-zinc-500">
              {title}
            </div>

            <div className="mt-1 text-sm font-semibold text-white">
              {value}
            </div>

            <div className="mt-1 text-[10px] text-zinc-500">
              {subtitle}
            </div>
          </div>

          <motion.div
            animate={{
              rotate: expanded ? 180 : 0,
            }}
            transition={{
              duration: 0.25,
            }}
            className="
              text-[10px]
              text-zinc-500
            "
          >
            ▼
          </motion.div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{
              height: 0,
              opacity: 0,
            }}
            animate={{
              height: 'auto',
              opacity: 1,
            }}
            exit={{
              height: 0,
              opacity: 0,
            }}
            transition={{
              duration: 0.25,
            }}
            className="overflow-hidden"
          >
            <div
              className="
                border-t
                border-zinc-800
                px-3
                py-3
                space-y-3
                bg-zinc-950/60
              "
            >
              <div className="text-[11px] leading-relaxed text-zinc-300">
                {description}
              </div>

              <div className="space-y-2">
                {interpretation.map(
                  (item, index) => (
                    <div
                      key={index}
                      className="
                        rounded-lg
                        border
                        border-zinc-800
                        bg-zinc-900/40
                        px-2
                        py-2
                        text-[10px]
                        leading-relaxed
                        text-zinc-400
                      "
                    >
                      {item}
                    </div>
                  ),
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function MobileFinalizedInstitutionalNumbers() {
  const finalized =
    useFinalizedInstitutionalSnapshot()

  const [expanded, setExpanded] =
    useState<CardKey | null>(null)

  if (!finalized.snapshotReady) {
    console.log('[FINALIZED_NUMBERS_HIDDEN_REASON]', {
      ts: Date.now(),
      reason: 'SNAPSHOT_NOT_READY',
      finalizedSnapshotReady:
        finalized.snapshotReady,
      finalizedConfirmedCandleTs:
        finalized.confirmedCandleTs,
      finalizedSampleCount:
        finalized.sampleCount,
    })

    return null
  }

  const toggle = (key: CardKey) => {
    setExpanded(prev =>
      prev === key ? null : key,
    )
  }

  return (
    <section className="mt-3 grid grid-cols-2 gap-2">
      <MobileExpandableCard
        title="OI Avg"
        value={formatNumber(
          finalized.oiDeltaAverage,
          4,
        )}
        subtitle={`OI Accum ${formatNumber(
          finalized.oiDeltaAccum,
          4,
        )}`}
        expanded={expanded === 'OI'}
        onToggle={() => toggle('OI')}
        accent="bg-emerald-500/10"
        description="최근 약 30분 동안의 평균 OI 변화량입니다. 상태/압력 판단은 단순 크기가 아니라 방향 지속성과 velocity 기준입니다."
        interpretation={[
          'OI Avg = 평균 포지션 변화량',
          'OI Accum = 30분 누적 변화량',
          'Directional Pressure는 OI 크기보다 방향 지속성을 더 중요하게 봄',
          'OI가 커도 지속성이 낮으면 NEUTRAL/WEAK로 해석될 수 있음',
        ]}
      />

      <MobileExpandableCard
        title="Funding"
        value={formatPercent(
          finalized.fundingAverage,
          4,
        )}
        subtitle={finalized.fundingState}
        expanded={expanded === 'FUNDING'}
        onToggle={() => toggle('FUNDING')}
        accent="bg-yellow-500/10"
        description="최근 약 30분동안 평균 펀딩 압력 변화입니다."
        interpretation={[
          '양수 = 롱 과열 가능성',
          '음수 = 숏 과열 가능성',
          'Funding + Whale 급증 = 청산 설계 가능성',
        ]}
      />

      <MobileExpandableCard
        title="Volume Avg"
        value={`${formatNumber(
          finalized.volumeRatioAverage,
          2,
        )}x`}
        subtitle={`Tick State ${finalized.volumeState}`}
        expanded={expanded === 'VOLUME'}
        onToggle={() => toggle('VOLUME')}
        accent="bg-blue-500/10"
        description="최근 약 30분 동안의 평균 거래량 배율입니다. 상태값은 평균 크기가 아니라 Expansion/Weak tick 빈도 기준입니다."
        interpretation={[
          '1.0x = 기준 거래량 수준',
          '1.2x 이상 = 거래량 확장 tick',
          '0.85x 이하 = 약한 거래량 tick',
          'State는 평균 배율이 아니라 30분 동안 어떤 tick이 더 많았는지를 의미',
        ]}
      />

      <MobileExpandableCard
        title="Whale"
        value={formatNumber(
          finalized.whaleIntensityAverage,
          2,
        )}
        subtitle={finalized.whaleBias}
        expanded={expanded === 'WHALE'}
        onToggle={() => toggle('WHALE')}
        accent="bg-red-500/10"
        description="최근 약 30분동안 고래/기관 개입 강도 변화입니다."
        interpretation={[
          '0~30 = 낮음',
          '30~60 = 중간',
          '70+ = 강한 개입 / 스퀴즈 위험',
        ]}
      />
    </section>
  )
}
