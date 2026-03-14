'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useRef, useEffect } from 'react'

import { BollingerSignalType } from '@/lib/market/actionGate/signalType'
import { useTypewriter } from '@/hooks/useTypewriter'
import { useInterpretationTransition } from '@/hooks/useInterpretationTransition'
import { highlightKeywords } from '@/lib/market/actionGate/highlightKeywords'
import { PremiumLightSweep } from '@/components/market/animation/PremiumLightSweep'

interface Props {
  description: string
  signalType?: BollingerSignalType
}

/* =========================================================
   🎖 Premium Action Gate Description Hero (Stable)
   - Typewriter
   - Keyword Highlight
   - Interpretation Flash
   - Premium Glow
   - Light Sweep Component
   - Volatility Pulse
   - Description Freeze
========================================================= */

export function ActionGateDescriptionHero({
  description,
  signalType,
}: Props) {

  /* =====================================================
     1️⃣ Description Freeze (signalType 기준 유지)
  ===================================================== */

  const stableDescriptionRef = useRef(description)

  useEffect(() => {
    stableDescriptionRef.current = description
  }, [signalType])

  const stableDescription = stableDescriptionRef.current

  /* =====================================================
     2️⃣ 상태별 Accent 컬러
  ===================================================== */

  const getAccent = () => {

    if (!signalType)
      return 'rgba(16,185,129,0.45)'

    if (signalType.toString().includes('UPPER'))
      return 'rgba(251,191,36,0.55)'

    if (signalType.toString().includes('LOWER'))
      return 'rgba(239,68,68,0.55)'

    return 'rgba(16,185,129,0.55)'
  }

  const accent = getAccent()

  /* =====================================================
     3️⃣ 위험 신호 pulse
  ===================================================== */

  const isExtreme =
    signalType ===
      BollingerSignalType.INSIDE_UPPER_BREAK_AND_DEVIATE ||
    signalType ===
      BollingerSignalType.INSIDE_LOWER_BREAK_AND_DEVIATE

  /* =====================================================
     4️⃣ Typewriter
  ===================================================== */

  const typedText = useTypewriter(stableDescription, 12)

  /* =====================================================
     5️⃣ 해석 변경 감지
  ===================================================== */

  const { flash } =
    useInterpretationTransition(signalType)

  return (

    <motion.div
      key={signalType ?? 'default'}
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-black/70 p-6"
      style={{
        boxShadow: `0 0 70px ${accent}`,
      }}
    >

      {/* =================================================
         Interpretation Flash
      ================================================= */}

      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.55 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="absolute inset-0 pointer-events-none rounded-2xl"
            style={{
              background: `radial-gradient(circle at center, ${accent}, transparent 70%)`,
            }}
          />
        )}
      </AnimatePresence>

      {/* =================================================
         Premium Light Sweep
      ================================================= */}

      <PremiumLightSweep />

      {/* =================================================
         Aura Glow
      ================================================= */}

      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
        }}
        style={{
          background: `radial-gradient(circle at center, ${accent}, transparent 70%)`,
        }}
      />

      {/* =================================================
         Volatility Pulse
      ================================================= */}

      {isExtreme && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{
            opacity: [0, 0.35, 0],
            scale: [0.96, 1.03, 0.96],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
          style={{
            background: `radial-gradient(circle at center, ${accent}, transparent 70%)`,
          }}
        />
      )}

      {/* =================================================
         Horizontal Scan Line
      ================================================= */}

      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          backgroundPosition: ['0% 0%', '200% 0%'],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{
          backgroundImage:
            'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
          backgroundSize: '200% 100%',
        }}
      />

      {/* =================================================
         Description
      ================================================= */}

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="
          relative
          text-lg md:text-xl
          leading-relaxed
          text-white
          font-medium
          tracking-wide
        "
        style={{
          textShadow: `0 0 28px ${accent}`,
        }}
      >
        {highlightKeywords(typedText)}
      </motion.p>

    </motion.div>
  )
}
