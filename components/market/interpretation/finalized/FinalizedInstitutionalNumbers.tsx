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

type ExpandableCardProps = {
  id: CardKey
  title: string
  value: string
  subtitle: string
  accent: string
  expanded: boolean
  onToggle: () => void
  meaning: string
  interpretation: string[]
  combination: string[]
}

function ExpandableInstitutionCard({
  title,
  value,
  subtitle,
  accent,
  expanded,
  onToggle,
  meaning,
  interpretation,
  combination,
}: ExpandableCardProps) {
  return (
    <motion.div
      layout
      transition={{
        duration: 0.32,
        ease: 'easeOut',
      }}
      className="
        rounded-2xl
        border
        border-zinc-800
        bg-zinc-950/60
        backdrop-blur-xl
        overflow-hidden
        cursor-pointer
        group
      "
      onClick={onToggle}
    >
      <motion.div
        whileHover={{
          y: -2,
        }}
        className="
          relative
          p-4
        "
      >
        <div
          className={`
            absolute inset-0 opacity-0
            group-hover:opacity-100
            transition-opacity duration-300
            ${accent}
          `}
        />

        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs tracking-wide text-zinc-500">
                {title}
              </div>

              <div className="mt-2 text-2xl font-bold text-white">
                {value}
              </div>

              <div className="mt-2 text-[11px] text-zinc-500">
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
                text-zinc-500
                text-xs
                mt-1
              "
            >
              ▼
            </motion.div>
          </div>
        </div>
      </motion.div>

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
              duration: 0.28,
              ease: 'easeOut',
            }}
            className="overflow-hidden"
          >
            <div
              className="
                border-t
                border-zinc-800
                bg-black/20
                px-4
                py-4
                space-y-4
              "
            >
              <div>
                <div className="text-[11px] font-semibold tracking-wide text-emerald-400">
                  의미
                </div>

                <div className="mt-2 text-sm leading-relaxed text-zinc-300">
                  {meaning}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-semibold tracking-wide text-yellow-400">
                  해석
                </div>

                <div className="mt-2 space-y-2">
                  {interpretation.map(
                    (item, index) => (
                      <div
                        key={index}
                        className="
                          rounded-xl
                          border
                          border-zinc-800
                          bg-zinc-900/50
                          px-3
                          py-2
                          text-xs
                          leading-relaxed
                          text-zinc-300
                        "
                      >
                        {item}
                      </div>
                    ),
                  )}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-semibold tracking-wide text-blue-400">
                  조합 해석
                </div>

                <div className="mt-2 space-y-2">
                  {combination.map(
                    (item, index) => (
                      <div
                        key={index}
                        className="
                          rounded-xl
                          border
                          border-blue-500/20
                          bg-blue-500/5
                          px-3
                          py-2
                          text-xs
                          leading-relaxed
                          text-zinc-300
                        "
                      >
                        {item}
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function FinalizedInstitutionalNumbers() {
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
    <section
      className="
        mt-6
        grid
        grid-cols-1
        md:grid-cols-2
        xl:grid-cols-4
        gap-4
      "
    >
      <ExpandableInstitutionCard
        id="OI"
        title="OI"
        value={formatNumber(
          finalized.oiDeltaAverage,
          4,
        )}
        subtitle={`Accum ${formatNumber(
          finalized.oiDeltaAccum,
          4,
        )}`}
        accent="bg-emerald-500/5"
        expanded={expanded === 'OI'}
        onToggle={() => toggle('OI')}
        meaning="
최근 약 30분 동안 기관 포지션 에너지의 누적 변화입니다.
Open Interest는 시장에 새롭게 들어온 레버리지 포지션 규모를 의미합니다.
        "
        interpretation={[
          'OI 증가 = 신규 포지션 유입 가능성',
          'OI 감소 = 포지션 청산 또는 레버리지 제거 가능성',
          'OI 급증 시 기관 포지션 구축 가능성을 의심할 수 있습니다.',
        ]}
        combination={[
          'OI 증가 + Volume 증가 + Whale 상승 = 기관 포지션 유입 가능성',
          'OI 급감 + Funding 감소 = 대규모 청산 또는 레버리지 축소 가능성',
        ]}
      />

      <ExpandableInstitutionCard
        id="FUNDING"
        title="Funding"
        value={formatPercent(
          finalized.fundingAverage,
          4,
        )}
        subtitle={finalized.fundingState}
        accent="bg-yellow-500/5"
        expanded={expanded === 'FUNDING'}
        onToggle={() => toggle('FUNDING')}
        meaning="
최근 약 30분 동안 시장 전체의 평균 funding pressure 입니다.
Funding은 롱/숏 포지션의 과열 방향을 보여줍니다.
        "
        interpretation={[
          '양수 Funding = 롱 포지션 과열 가능성',
          '음수 Funding = 숏 포지션 과열 가능성',
          'Funding 극단값은 청산 유도 환경을 만들 수 있습니다.',
        ]}
        combination={[
          'Funding 양수 + OI 급증 + Whale 70+ = 롱 과열 또는 롱 청산 설계 가능성',
          'Funding 음수 + Whale 증가 = 숏 과열 이후 반등 가능성',
        ]}
      />

      <ExpandableInstitutionCard
        id="VOLUME"
        title="Volume"
        value={`${formatNumber(
          finalized.volumeRatioAverage,
          2,
        )}x`}
        subtitle={finalized.volumeState}
        accent="bg-blue-500/5"
        expanded={expanded === 'VOLUME'}
        onToggle={() => toggle('VOLUME')}
        meaning="
최근 약 30분 동안 거래량 확장 강도를 의미합니다.
기관 참여 여부를 판단할 수 있는 핵심 지표입니다.
        "
        interpretation={[
          '1x 이하 = 거래량 부족 상태',
          '2x~3x 이상 = 기관 개입 또는 대규모 체결 가능성',
          'Volume 급증은 변동성 확장의 선행 신호일 수 있습니다.',
        ]}
        combination={[
          'Volume 증가 + Whale 상승 = 실제 기관 개입 가능성 증가',
          'Volume 감소 + OI 감소 = 시장 에너지 축소 가능성',
        ]}
      />

      <ExpandableInstitutionCard
        id="WHALE"
        title="Whale"
        value={formatNumber(
          finalized.whaleIntensityAverage,
          2,
        )}
        subtitle={finalized.whaleBias}
        accent="bg-red-500/5"
        expanded={expanded === 'WHALE'}
        onToggle={() => toggle('WHALE')}
        meaning="
최근 약 30분 동안 고래/기관 개입 intensity 를 의미합니다.
대형 체결과 시장 압력의 강도를 보여줍니다.
        "
        interpretation={[
          '0~30 = 낮은 개입 강도',
          '30~60 = 중간 수준의 기관 개입 가능성',
          '70 이상 = 강한 개입 / 스퀴즈 위험 증가 가능성',
        ]}
        combination={[
          'Whale 상승 + OI 상승 = 기관 방향성 구축 가능성',
          'Whale 70+ + Funding 과열 = 청산 유도 가능성 증가',
        ]}
      />
    </section>
  )
}
