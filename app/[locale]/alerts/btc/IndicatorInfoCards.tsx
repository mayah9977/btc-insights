// app/[locale]/alerts/btc/IndicatorInfoCards.tsx

'use client'

import { useMemo, useState } from 'react'
import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity,
  ChevronDown,
  Landmark,
  TrendingUp,
  Waves,
} from 'lucide-react'

type IndicatorKey =
  | 'RSI'
  | 'MACD'
  | 'EMA'
  | 'INSTITUTIONAL_FLOW'

type InfoCard = {
  key: IndicatorKey
  title: string
  subtitle: string
  icon: typeof Activity
  sections: Array<{
    title: string
    content: string[]
    tone?: 'default' | 'point' | 'warning'
  }>
}

const cards: InfoCard[] = [
  {
    key: 'RSI',

    // MODIFIED: timeframe-aware subtitle
    title: 'RSI 설명',
    subtitle: '15M 모멘텀 과열 / 1H 구조 과매수·과매도 해석',

    icon: Activity,

    sections: [
      {
        // MODIFIED: timeframe-aware RSI overview
        title: '지표 개요',
        content: [
          'RSI는 가격 상승과 하락 강도를 기반으로 현재 시장의 momentum pressure 상태를 해석하는 상대강도지수입니다.',
          '현재 알람 구조에서는 15M RSI를 단기 momentum layer로 사용하고, 1H RSI를 상위 structure layer로 함께 해석합니다.',
        ],
      },

      {
        // MODIFIED: actual alert interpretation wording
        title: '핵심 포인트',
        tone: 'point',
        content: [
          '15M RSI는 단기 과열 상태와 rebound attempt 발생 여부를 빠르게 감지하는 momentum layer로 사용됩니다.',
          '1H RSI는 상위 구조 기준에서 과매수 / 과매도 pressure가 유지되는지 확인하는 structure layer 역할을 수행합니다.',
          '15M 과열 신호가 발생하더라도 1H 구조가 강하게 유지되는 경우에는 momentum exhaustion보다 구조 유지 흐름에 더 무게가 실릴 수 있습니다.',
        ],
      },

      {
        // MODIFIED: safer terminal-grade warning wording
        title: '주의사항',
        tone: 'warning',
        content: [
          'RSI는 단독 방향 예측 지표가 아니라 현재 momentum pressure 상태를 해석하기 위한 보조 구조 레이어입니다.',
          '강한 추세 구간에서는 과매수 / 과매도 상태가 장시간 유지될 수 있으므로 15M 반응과 1H 구조를 함께 확인하는 것이 중요합니다.',
        ],
      },
    ],
  },

  {
    key: 'MACD',

    // MODIFIED: timeframe-aware subtitle
    title: 'MACD 설명',
    subtitle: '15M 모멘텀 전환 / 1H 구조 정렬 상태 해석',

    icon: Waves,

    sections: [
      {
        // MODIFIED: structure-aware overview
        title: '지표 개요',
        content: [
          'MACD는 단기 EMA와 장기 EMA의 간격 변화를 기반으로 momentum transition과 trend structure 변화를 함께 읽는 지표입니다.',
          '현재 알람 구조에서는 15M MACD를 단기 momentum shift 감지 레이어로 사용하고, 1H MACD를 상위 trend alignment 확인 레이어로 해석합니다.',
        ],
      },

      {
        // MODIFIED: alert-linked interpretation
        title: '핵심 포인트',
        tone: 'point',
        content: [
          '15M MACD는 단기 momentum 방향이 전환되는 초기 흐름을 감지하는 역할을 수행합니다.',
          '1H MACD는 상위 timeframe 기준에서 현재 trend structure alignment가 유지되는지 확인하는 구조 레이어입니다.',
          '15M MACD transition이 발생하더라도 1H 구조 alignment가 유지되지 않으면 단기 noise 가능성을 함께 고려해야 합니다.',
        ],
      },

      {
        // MODIFIED: production-safe warning
        title: '주의사항',
        tone: 'warning',
        content: [
          '변동성이 매우 작은 구간에서는 MACD transition이 반복되며 noise가 증가할 수 있습니다.',
          '단기 cross 반응만 해석하기보다 거래량 확장 여부와 상위 structure alignment를 함께 확인하는 것이 중요합니다.',
        ],
      },
    ],
  },

  {
    key: 'EMA',

    // MODIFIED: timeframe-aware subtitle
    title: 'EMA(이동평균선) 설명',
    subtitle: '15M 방향 전환 / 1H 상위 추세 구조 유지 확인',

    icon: TrendingUp,

    sections: [
      {
        // MODIFIED: structure-aware EMA overview
        title: '지표 개요',
        content: [
          'EMA는 최근 가격에 더 높은 가중치를 부여해 현재 시장의 directional pressure를 빠르게 반영하는 이동평균선입니다.',
          '현재 알람 구조에서는 15M EMA를 단기 방향 변화 감지 layer로 사용하고, 1H EMA를 상위 trend maintenance 확인 layer로 해석합니다.',
        ],
      },

      {
        // MODIFIED: terminal-grade directional wording
        title: '핵심 포인트',
        tone: 'point',
        content: [
          '15M EMA 구조는 단기 directional momentum 변화와 acceleration 흐름을 빠르게 감지하는 역할을 수행합니다.',
          '1H EMA 구조는 현재 상위 trend structure가 유지되는지 확인하는 higher timeframe layer로 사용됩니다.',
          '가격이 EMA 구조 위 또는 아래에서 지속적으로 유지되는지 여부는 현재 시장 directional bias 해석에 중요한 기준이 됩니다.',
        ],
      },

      {
        // MODIFIED: safer warning wording
        title: '주의사항',
        tone: 'warning',
        content: [
          'EMA는 후행성이 존재하기 때문에 급격한 변동 직후에는 단기 반응보다 늦게 구조 변화가 나타날 수 있습니다.',
          '횡보 구간에서는 EMA transition이 반복되며 방향성이 불안정해질 수 있으므로 상위 timeframe 구조와 함께 해석해야 합니다.',
        ],
      },
    ],
  },

  // NEVER MODIFIED — Institutional Flow card preserved exactly as original
  {
    key: 'INSTITUTIONAL_FLOW',
    title: 'Institutional Flow',
    subtitle: '기관 압력 / 유동성 포지셔닝 구조 해석',
    icon: Landmark,
    sections: [
      {
        title: '구조 개요',
        content: [
          'Institutional Flow는 단순 기술적 지표가 아니라, 현재 시장 안에서 누적되는 기관성 압력과 유동성 포지셔닝을 해석하는 구조 분석 레이어입니다.',
          '30분 누적 snapshot을 기반으로 OI 압력, Funding 상태, Volume 확장, Whale Flow, 청산 압력, 흡수/스윕 이벤트를 함께 읽습니다.',
        ],
      },
      {
        title: '핵심 포인트',
        tone: 'point',
        content: [
          'Long Pressure Building은 롱 방향 포지셔닝 압력이 누적되는 구조를 의미합니다.',
          'Short Pressure Building은 숏 방향 포지셔닝 압력이 우세해지는 흐름을 의미합니다.',
          'Whale Distribution은 고래 매도 압력과 분산 흐름이 강해지는 구간을 해석합니다.',
          'Institutional Absorption은 매도/매수 압력을 기관성 흡수 흐름이 받아내는 구조를 추적합니다.',
          'Liquidity Sweep Risk는 유동성 회수와 청산 압력이 함께 커지는 시장 구조를 확인합니다.',
        ],
      },
      {
        title: '분석 관점',
        content: [
          '이 레이어는 RSI/MACD/EMA처럼 단일 계산식으로 만들어지는 신호가 아니라, 여러 pressure metric을 함께 묶어 시장 구조를 읽습니다.',
          '핵심은 방향을 맞히는 것이 아니라, 현재 시장에서 어떤 압력이 누적되고 어떤 포지셔닝이 우세한지를 해석하는 것입니다.',
        ],
      },
      {
        title: '주의사항',
        tone: 'warning',
        content: [
          'Institutional Flow is not a price prediction engine.',
          'Cumulative positioning and pressure changes in the current market',
          'This is the structural analysis layer for analysis.',
          '따라서 이 카드는 매수/매도 추천이 아니라, 현재 시장 압력 구조를 읽기 위한 terminal-style 해석 도구로 사용해야 합니다.',
        ],
      },
    ],
  },
]

function toneClass(tone: 'default' | 'point' | 'warning' = 'default') {
  if (tone === 'point') {
    return 'border-emerald-300/20 bg-emerald-400/10'
  }

  if (tone === 'warning') {
    return 'border-cyan-300/20 bg-cyan-400/10'
  }

  return 'border-white/10 bg-white/[0.03]'
}

export default function IndicatorInfoCards() {
  const [openKey, setOpenKey] = useState<IndicatorKey | null>(null)

  const isMobile = useMemo(
    () => typeof window !== 'undefined' && window.innerWidth < 640,
    [],
  )

  const handleToggle = (key: IndicatorKey) => {
    setOpenKey(prev => (prev === key ? null : key))
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
      {cards.map(card => {
        const active = openKey === card.key
        const Icon = card.icon

        return (
          <motion.div
            key={card.key}
            layout
            transition={{
              type: 'spring',
              stiffness: 280,
              damping: 26,
            }}
            className={clsx(
              'group relative overflow-hidden rounded-[26px] border backdrop-blur-xl',
              'shadow-[0_10px_40px_rgba(0,0,0,0.42)] transition-all duration-200',
              active
                ? 'border-emerald-300/40 bg-gradient-to-br from-emerald-400/20 via-cyan-400/15 to-sky-500/15 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_0_24px_rgba(16,185,129,0.18),0_0_56px_rgba(6,182,212,0.12)]'
                : 'border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.06]',
            )}
          >
            <div
              className={clsx(
                'pointer-events-none absolute inset-0 transition-opacity duration-300',
                active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
              )}
            >
              <div className="absolute -left-10 top-0 h-28 w-28 rounded-full bg-emerald-400/18 blur-3xl" />
              <div className="absolute -right-10 bottom-0 h-28 w-28 rounded-full bg-cyan-400/18 blur-3xl" />
            </div>

            {active && (
              <motion.div
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-[26px]"
                animate={{ opacity: [0.45, 0.8, 0.45] }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                style={{
                  boxShadow:
                    'inset 0 0 0 1px rgba(255,255,255,0.06), inset 0 0 36px rgba(16,185,129,0.12)',
                }}
              />
            )}

            <motion.button
              type="button"
              onClick={() => handleToggle(card.key)}
              whileHover={{ scale: 1.01, y: -1 }}
              whileTap={{ scale: 0.985 }}
              transition={{
                type: 'spring',
                stiffness: 360,
                damping: 24,
              }}
              className="relative z-10 flex w-full items-center justify-between gap-4 p-5 text-left sm:min-h-[150px] sm:flex-col sm:items-start sm:justify-start sm:p-6"
            >
              <div className="flex min-w-0 items-center gap-4 sm:w-full sm:items-start sm:justify-between">
                <div
                  className={clsx(
                    'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border transition',
                    active
                      ? 'border-white/20 bg-white/12 text-emerald-100 shadow-[0_0_22px_rgba(16,185,129,0.35)]'
                      : 'border-white/10 bg-white/5 text-white/75',
                  )}
                >
                  <Icon className="h-6 w-6" />
                </div>

                <div className="min-w-0 flex-1 sm:mt-5 sm:flex-none">
                  <div
                    className={clsx(
                      'text-sm font-extrabold tracking-[0.18em]',
                      active ? 'text-white' : 'text-white/90',
                    )}
                  >
                    {card.title}
                  </div>

                  <div
                    className={clsx(
                      'mt-2 text-xs',
                      active ? 'text-white/78' : 'text-white/52',
                    )}
                  >
                    {card.subtitle}
                  </div>
                </div>
              </div>

              <motion.div
                animate={{ rotate: active ? 180 : 0 }}
                transition={{ duration: 0.22 }}
                className={clsx(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border',
                  active
                    ? 'border-emerald-300/30 bg-emerald-400/12 text-emerald-100'
                    : 'border-white/10 bg-white/5 text-white/60',
                )}
              >
                <ChevronDown className="h-4 w-4" />
              </motion.div>
            </motion.button>

            <AnimatePresence initial={false}>
              {active && (
                <motion.div
                  key="content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{
                    duration: 0.28,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="relative z-10 overflow-hidden"
                >
                  <div className="px-5 pb-5 pt-0 sm:px-6 sm:pb-6">
                    <div className="space-y-3">
                      {card.sections.map(section => (
                        <div
                          key={section.title}
                          className={clsx(
                            'rounded-2xl border p-4',
                            toneClass(section.tone),
                          )}
                        >
                          <div
                            className={clsx(
                              'mb-2 text-[11px] font-bold tracking-[0.18em]',
                              section.tone === 'point'
                                ? 'text-emerald-200'
                                : section.tone === 'warning'
                                  ? 'text-cyan-200'
                                  : 'text-white/78',
                            )}
                          >
                            {section.title}
                          </div>

                          <div className="space-y-2">
                            {section.content.map((line, idx) => (
                              <p
                                key={idx}
                                className="text-[13px] leading-6 text-white/78"
                              >
                                {line}
                              </p>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )
      })}
    </div>
  )
}
