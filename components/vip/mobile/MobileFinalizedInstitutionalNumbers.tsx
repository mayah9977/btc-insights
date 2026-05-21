//components/vip/mobile/MobileFinalizedInstitutionalNumbers.tsx

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
        title="OI"
        value={formatNumber(
          finalized.oiDeltaAverage,
          4,
        )}
        subtitle={`Accum ${formatNumber(
          finalized.oiDeltaAccum,
          4,
        )}`}
        expanded={expanded === 'OI'}
        onToggle={() => toggle('OI')}
        accent="bg-emerald-500/10"
        description="
최근 약 30분동안 기관 포지션 에너지의 누적 변화입니다.
        "
        interpretation={[
          'OI 증가 = 신규 포지션 유입 가능성',
          'OI 감소 = 포지션 청산 가능성',
          'OI + Volume + Whale 상승 = 기관 개입 가능성',
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
        description="
최근 약 30분동안 평균 펀딩 압력 변화입니다.
        "
        interpretation={[
          '양수 = 롱 과열 가능성',
          '음수 = 숏 과열 가능성',
          'Funding + Whale 급증 = 청산 설계 가능성',
        ]}
      />

      <MobileExpandableCard
        title="Volume"
        value={`${formatNumber(
          finalized.volumeRatioAverage,
          2,
        )}x`}
        subtitle={finalized.volumeState}
        expanded={expanded === 'VOLUME'}
        onToggle={() => toggle('VOLUME')}
        accent="bg-blue-500/10"
        description="
최근 약 30분동안 거래량 확장 강도 변화입니다.
        "
        interpretation={[
          '1x 이하 = 거래량 부족',
          '2x~3x 이상 = 기관 체결 가능성',
          'Volume 증가 = 변동성 확장 가능성',
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
        description="
최근 약 30분동안 고래/기관 개입 강도 변화입니다.
        "
        interpretation={[
          '0~30 = 낮음',
          '30~60 = 중간',
          '70+ = 강한 개입 / 스퀴즈 위험',
        ]}
      />
    </section>
  )
} 
