'use client'

import { motion } from 'framer-motion'

interface Props {
  intensity?: number
}

/**
 * PremiumLightSweep
 *
 * 목적
 * 금융 대시보드 스타일 Light Sweep
 *
 * 특징
 * - 위에서 아래로 흐르는 빛
 * - 카드 반사 느낌
 * - 매우 가벼운 애니메이션
 */

export function PremiumLightSweep({
  intensity = 0.08,
}: Props) {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden"

      animate={{
        backgroundPosition: ['0% -100%', '0% 200%'],
      }}

      transition={{
        duration: 4,
        repeat: Infinity,
        ease: 'linear',
      }}

      style={{
        backgroundImage: `
          linear-gradient(
            180deg,
            transparent 0%,
            rgba(255,255,255,${intensity}) 35%,
            rgba(255,255,255,${intensity * 0.6}) 50%,
            rgba(255,255,255,${intensity}) 65%,
            transparent 100%
          )
        `,
        backgroundSize: '100% 200%',
      }}
    />
  )
}
