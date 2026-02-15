'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useLiveRiskState } from '@/lib/realtime/liveRiskState'
import type { RiskLevel } from '@/lib/vip/riskTypes'
import type { RiskDirection } from '@/lib/realtime/liveRiskState'

const baseStyleMap: Record<
  RiskLevel,
  {
    bg: string
    text: string
    baseGlow: string
  }
> = {
  LOW: {
    bg: 'bg-vipSafe/20',
    text: 'text-emerald-300',
    baseGlow: 'shadow-[0_0_16px_rgba(16,185,129,0.25)]',
  },
  MEDIUM: {
    bg: 'bg-vipAccent/20',
    text: 'text-sky-300',
    baseGlow: 'shadow-[0_0_20px_rgba(56,189,248,0.3)]',
  },
  HIGH: {
    bg: 'bg-vipDanger/20',
    text: 'text-orange-300',
    baseGlow: 'shadow-[0_0_28px_rgba(239,68,68,0.45)]',
  },
  EXTREME: {
    bg: 'bg-vipDanger/30',
    text: 'text-red-200',
    baseGlow: 'shadow-[0_0_40px_rgba(239,68,68,0.65)]',
  },
}

export default function VIPRiskPulse() {
  // ✅ SSOT에서 state만 정확히 선택
  const live = useLiveRiskState(s => s.state)
  if (!live) return null

  const { level, direction } = live
  const s = baseStyleMap[level]

  /* =========================
   * 🔥 Pulse 설정 (TS-safe)
   * ========================= */
  const pulseConfig = (() => {
    switch (direction as RiskDirection) {
      case 'UP':
        return {
          scale: [1, 1.06, 1],
          duration: 1.2,
          glow: 'shadow-[0_0_56px_rgba(239,68,68,0.75)]',
          hint: '위험 상승 중',
        }

      case 'DOWN':
        return {
          scale: [1, 1.03, 1],
          duration: 2.2,
          glow: 'shadow-[0_0_20px_rgba(16,185,129,0.35)]',
          hint: '위험 완화 중',
        }

      case 'STABLE':
      default:
        return {
          scale: [1, 1.02, 1],
          duration: 3,
          glow: s.baseGlow,
          hint: '안정 상태',
        }
    }
  })()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={level}
        animate={{ scale: pulseConfig.scale }}
        transition={{
          duration: pulseConfig.duration,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className={[
          'rounded-xl px-5 py-4',
          'border border-white/5',
          'backdrop-blur',
          s.bg,
          s.text,
          pulseConfig.glow,
        ].join(' ')}
      >
        <div className="text-xs font-semibold tracking-widest opacity-80">
          LIVE RISK
        </div>

        <div className="mt-1 text-2xl font-extrabold">
          {level}
        </div>

        {/* 상태 힌트 */}
        <div className="mt-1 text-xs opacity-70">
          {pulseConfig.hint}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
