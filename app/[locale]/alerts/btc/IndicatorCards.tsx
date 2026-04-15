'use client'

import clsx from 'clsx'
import { motion } from 'framer-motion'
import {
  Activity,
  Waves,
  TrendingUp,
} from 'lucide-react'
import { useAlertsStore } from '../providers/alertsStore.zustand'

export default function IndicatorCards() {
  const indicatorEnabled = useAlertsStore(s => s.indicatorEnabled)
  const setIndicatorEnabled = useAlertsStore(s => s.setIndicatorEnabled)

  const toggle = async (key: 'RSI' | 'MACD' | 'EMA') => {
    const next = {
      ...indicatorEnabled,
      [key]: !indicatorEnabled[key],
    }

    setIndicatorEnabled(next)

    try {
      await fetch('/api/alerts/indicator-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      })
    } catch (e) {
      console.error('[indicator-toggle]', e)
    }
  }

  const cards: Array<{
    key: 'RSI' | 'MACD' | 'EMA'
    label: string
    description: string
    icon: typeof Activity
  }> = [
    {
      key: 'RSI',
      label: 'RSI 알람',
      description: 'Overbought(과매수) / Oversold(과매도)',
      icon: Activity,
    },
    {
      key: 'MACD',
      label: 'MACD 알람',
      description: 'Golden(골든크로스) / Dead(데드크로스)',
      icon: Waves,
    },
    {
      key: 'EMA',
      label: 'EMA(이평선) 알람 ',
      description: 'Trend Cross Signal(골든/데드크로스)',
      icon: TrendingUp,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {cards.map(card => {
        const active = indicatorEnabled[card.key]
        const Icon = card.icon

        return (
          <motion.button
            key={card.key}
            type="button"
            onClick={() => toggle(card.key)}
            whileHover={{
              scale: active ? 1.05 : 1.03,
              y: -4,
            }}
            whileTap={{
              scale: 0.95,
            }}
            transition={{
              type: 'spring',
              stiffness: 360,
              damping: 20,
            }}
            className={clsx(
              'group relative overflow-hidden rounded-[26px] border text-left',
              'min-h-[140px] p-6 sm:min-h-[160px] sm:p-7',
              'backdrop-blur-xl transition-all duration-200',
              'focus:outline-none',
              active
                ? [
                    'border-emerald-300/40',
                    'bg-gradient-to-br from-emerald-400/30 via-cyan-400/25 to-sky-500/25',
                    'shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_0_30px_rgba(16,185,129,0.45),0_0_80px_rgba(6,182,212,0.35)]',
                  ]
                : [
                    'border-white/10',
                    'bg-white/[0.04]',
                    'shadow-[0_10px_40px_rgba(0,0,0,0.4)]',
                    'hover:border-white/20',
                    'hover:bg-white/[0.06]',
                    'hover:shadow-[0_12px_50px_rgba(0,0,0,0.5)]',
                  ],
            )}
          >
            {/* Neon glow blobs */}
            <div
              className={clsx(
                'pointer-events-none absolute inset-0 transition-opacity duration-300',
                active
                  ? 'opacity-100'
                  : 'opacity-0 group-hover:opacity-100',
              )}
            >
              <div className="absolute -left-10 top-0 h-28 w-28 rounded-full bg-emerald-400/25 blur-3xl" />
              <div className="absolute -right-10 bottom-0 h-28 w-28 rounded-full bg-cyan-400/25 blur-3xl" />
            </div>

            {/* Pulse effect */}
            {active && (
              <motion.div
                className="pointer-events-none absolute inset-0 rounded-[26px]"
                animate={{
                  opacity: [0.6, 1, 0.6],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                style={{
                  boxShadow:
                    'inset 0 0 0 1px rgba(255,255,255,0.1), inset 0 0 40px rgba(16,185,129,0.25)',
                }}
              />
            )}

            <div className="relative z-10 flex h-full flex-col justify-between">
              <div className="flex items-start justify-between">
                {/* Icon */}
                <div
                  className={clsx(
                    'flex h-14 w-14 items-center justify-center rounded-2xl border transition',
                    active
                      ? 'border-white/20 bg-white/15 text-emerald-100 shadow-[0_0_25px_rgba(16,185,129,0.5)]'
                      : 'border-white/10 bg-white/5 text-white/70 group-hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]',
                  )}
                >
                  <Icon className="h-6 w-6" />
                </div>

                {/* Badge */}
                <div
                  className={clsx(
                    'rounded-full border px-3 py-1 text-[11px] font-bold tracking-[0.2em]',
                    active
                      ? 'border-emerald-300/40 bg-emerald-400/25 text-emerald-100 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                      : 'border-white/10 bg-white/5 text-white/50',
                  )}
                >
                  {active ? 'ON' : 'OFF'}
                </div>
              </div>

              <div className="mt-6">
                <div
                  className={clsx(
                    'text-[13px] font-extrabold tracking-[0.2em]',
                    active ? 'text-white' : 'text-white/90',
                  )}
                >
                  {card.label}
                </div>

                <div
                  className={clsx(
                    'mt-2 text-xs',
                    active ? 'text-white/80' : 'text-white/50',
                  )}
                >
                  {card.description}
                </div>
              </div>
            </div>
          </motion.button>
        )
      })}
    </div>
  )
}
