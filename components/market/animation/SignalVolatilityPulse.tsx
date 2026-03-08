'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { BollingerSignalType } from '@/lib/market/actionGate/signalType'

interface Props {
  signalType?: BollingerSignalType
  accent?: string
}

/**
 * SignalVolatilityPulse
 *
 * 목적
 * Extreme Bollinger signal 발생 시
 * 금융 대시보드 스타일 Pulse 효과
 *
 * 원칙
 * - 판단 ❌
 * - 계산 ❌
 * - UI 효과만 담당
 */

export function SignalVolatilityPulse({
  signalType,
  accent = 'rgba(239,68,68,0.45)',
}: Props) {

  /* =========================
     Extreme Signal 체크
  ========================= */

  const isExtreme =
    signalType ===
      BollingerSignalType.INSIDE_UPPER_BREAK_AND_DEVIATE ||
    signalType ===
      BollingerSignalType.INSIDE_LOWER_BREAK_AND_DEVIATE

  return (
    <AnimatePresence>
      {isExtreme && (
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-2xl"

          initial={{
            opacity: 0,
            scale: 0.95,
          }}

          animate={{
            opacity: [0, 0.35, 0],
            scale: [0.96, 1.06, 0.96],
          }}

          exit={{
            opacity: 0,
          }}

          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}

          style={{
            background: `radial-gradient(circle at center, ${accent}, transparent 70%)`,
          }}
        />
      )}
    </AnimatePresence>
  )
}
