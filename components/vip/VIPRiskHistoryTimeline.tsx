'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useVipRiskHistoryStore } from '@/lib/vip/riskHistoryStore'

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME'

type RiskHistoryItem = {
  level: RiskLevel
  time: string
  reason?: string
}

const levelStyle: Record<
  RiskLevel,
  { dot: string; glow?: string }
> = {
  LOW: {
    dot: 'bg-vipSafe',
    glow: 'shadow-[0_0_12px_rgba(16,185,129,0.35)]',
  },
  MEDIUM: {
    dot: 'bg-vipAccent',
    glow: 'shadow-[0_0_12px_rgba(56,189,248,0.35)]',
  },
  HIGH: {
    dot: 'bg-vipDanger',
    glow: 'shadow-[0_0_16px_rgba(239,68,68,0.45)]',
  },
  EXTREME: {
    dot: 'bg-vipDanger',
    glow: 'shadow-[0_0_28px_rgba(239,68,68,0.65)]',
  },
}

/**
 * Presenter-only
 * - props ❌
 * - 계산 ❌
 * - SSOT(store)에서 리스크 히스토리 직접 구독
 */
export default function VIPRiskHistoryTimeline() {
  const { history } = useVipRiskHistoryStore()
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history.length])

  if (!history || history.length === 0) {
    return null
  }

  return (
    <div className="max-h-72 overflow-y-auto space-y-4 pr-2">
      <AnimatePresence initial={false}>
        {history.map((h: RiskHistoryItem, i: number) => {
          const s = levelStyle[h.level]

          return (
            <motion.div
              key={`${h.time}-${i}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="flex items-start gap-4"
            >
              {/* Timeline */}
              <div className="flex flex-col items-center">
                <div
                  className={[
                    'w-3 h-3 rounded-full',
                    s.dot,
                    s.glow,
                  ].join(' ')}
                />
                {i !== history.length - 1 && (
                  <div className="w-px flex-1 bg-vipBorder mt-1" />
                )}
              </div>

              {/* Card */}
              <div className="flex-1 rounded-xl border border-vipBorder bg-vipCard p-4 shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-white">
                    Risk {h.level}
                  </span>
                  <span className="text-xs text-zinc-400">
                    {h.time}
                  </span>
                </div>

                {h.reason && (
                  <p className="mt-1 text-sm text-zinc-400 leading-relaxed">
                    {h.reason}
                  </p>
                )}
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>

      <div ref={bottomRef} />
    </div>
  )
}
