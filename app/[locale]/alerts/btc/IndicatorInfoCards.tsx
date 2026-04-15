// /app/[locale]/alerts/btc/IndicatorInfoCards.tsx
'use client'

import { useMemo, useState } from 'react'
import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity,
  ChevronDown,
  TrendingUp,
  Waves,
} from 'lucide-react'

type IndicatorKey = 'RSI' | 'MACD' | 'EMA'

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
    title: 'RSI 설명',
    subtitle: '과매수 / 과매도 강도 체크',
    icon: Activity,
    sections: [
      {
        title: '지표 개요',
        content: [
          'RSI는 가격 상승과 하락의 강도를 비교해서 현재 매수세와 매도세가 얼마나 강한지를 나타내는 상대강도지수입니다.',
          '일반적으로 70 이상이면 과매수, 30 이하이면 과매도로 해석합니다.',
        ],
      },
      {
        title: '핵심 포인트',
        tone: 'point',
        content: [
          '30 이하 구간은 반등 가능성을 체크하는 구간입니다.',
          '70 이상 구간은 단기 과열 여부를 확인하는 구간입니다.',
          '강한 추세장에서는 과매수/과매도 상태가 오래 지속될 수 있습니다.',
        ],
      },
      {
        title: '주의사항',
        tone: 'warning',
        content: [
          'RSI 하나만 보고 바로 진입하기보다 가격 구조와 추세 방향을 함께 확인해야 합니다.',
          '횡보장에서는 유용하지만 강한 추세장에서는 속임 신호가 자주 발생할 수 있습니다.',
        ],
      },
    ],
  },
  {
    key: 'MACD',
    title: 'MACD 설명',
    subtitle: '추세 전환과 모멘텀 변화',
    icon: Waves,
    sections: [
      {
        title: '지표 개요',
        content: [
          'MACD는 단기 EMA와 장기 EMA의 차이를 기반으로 만들어지며, 시장의 추세와 모멘텀 변화를 동시에 보여줍니다.',
          'MACD선과 Signal선의 교차를 통해 골든크로스 / 데드크로스를 해석합니다.',
        ],
      },
      {
        title: '핵심 포인트',
        tone: 'point',
        content: [
          'MACD가 Signal 위로 돌파하면 상승 모멘텀이 강화되는 신호로 볼 수 있습니다.',
          'MACD가 Signal 아래로 이탈하면 하락 모멘텀이 강해질 수 있습니다.',
          '제로라인 위/아래 위치까지 같이 보면 신호의 질이 더 좋아집니다.',
        ],
      },
      {
        title: '주의사항',
        tone: 'warning',
        content: [
          '변동성이 매우 작은 구간에서는 크로스가 잦아져 노이즈가 많아질 수 있습니다.',
          '크로스만 보지 말고 거래량과 가격 구조를 함께 확인하는 것이 좋습니다.',
        ],
      },
    ],
  },
  {
    key: 'EMA',
    title: 'EMA(이동평균선) 설명',
    subtitle: '단기 / 중기 추세 방향 확인',
    icon: TrendingUp,
    sections: [
      {
        title: '지표 개요',
        content: [
          'EMA는 최근 가격에 더 큰 가중치를 두는 이동평균선입니다.',
          '현재 알람 구조에서는 EMA20과 EMA50의 교차를 기준으로 추세 변화를 감지합니다.',
        ],
      },
      {
        title: '핵심 포인트',
        tone: 'point',
        content: [
          'EMA20이 EMA50 위로 올라가면 단기 추세 강화 신호로 해석할 수 있습니다.',
          'EMA20이 EMA50 아래로 내려가면 단기 약세 전환 가능성을 볼 수 있습니다.',
          '가격이 이평선 위에서 유지되는지 여부도 함께 보면 더 유용합니다.',
        ],
      },
      {
        title: '주의사항',
        tone: 'warning',
        content: [
          '급격한 변동 직후에는 후행성이 있어 진입 타이밍이 늦을 수 있습니다.',
          '횡보 구간에서는 이평선 크로스가 잦아져 신뢰도가 낮아질 수 있습니다.',
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
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
