'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ActionGateSentence } from '@/lib/market/actionGate/bollingerSentenceMap'
import { useMemo } from 'react'

type Props = {
  sentence: ActionGateSentence
  signalKey: string // 신호 변경 시 애니메이션 트리거
}

/* -------------------------------------------------------
   🎨 색상 테마 결정 (tendency 기반)
------------------------------------------------------- */
function getTheme(tendency: string) {
  const t = tendency.toLowerCase()

  if (t.includes('stable'))
    return {
      glow: 'shadow-[0_0_60px_rgba(34,197,94,0.35)]',
      border: 'border-emerald-400/60',
      gradient: 'from-emerald-400 via-teal-300 to-emerald-500',
      textMainGradient:
        'from-emerald-300 via-teal-200 to-emerald-400',
      textSub: 'text-emerald-100/90',
    }

  if (t.includes('sideways'))
    return {
      glow: 'shadow-[0_0_60px_rgba(250,204,21,0.35)]',
      border: 'border-yellow-400/60',
      gradient: 'from-yellow-400 via-amber-300 to-yellow-500',
      textMainGradient:
        'from-yellow-200 via-amber-300 to-yellow-400',
      textSub: 'text-yellow-100/90',
    }

  return {
    glow: 'shadow-[0_0_70px_rgba(239,68,68,0.45)]',
    border: 'border-red-500/70',
    gradient: 'from-red-500 via-orange-400 to-red-600',
    textMainGradient:
      'from-red-300 via-orange-300 to-red-400',
    textSub: 'text-red-100/90',
  }
}

export default function ActionGateLuxuryCard({
  sentence,
  signalKey,
}: Props) {
  const theme = useMemo(
    () => getTheme(sentence.tendency),
    [sentence.tendency],
  )

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={signalKey}
        initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.6 }}
        className={`
          relative
          rounded-2xl
          border
          ${theme.border}
          ${theme.glow}
          bg-gradient-to-br
          from-neutral-950
          via-neutral-900
          to-neutral-950
          p-10
          overflow-hidden
        `}
      >
        {/* 🔥 상단 골드 shimmer */}
        <motion.div
          animate={{ x: ['-100%', '100%'] }}
          transition={{ repeat: Infinity, duration: 6, ease: 'linear' }}
          className="
            absolute
            top-0
            left-0
            w-full
            h-[2px]
            bg-gradient-to-r
            from-transparent
            via-yellow-400
            to-transparent
          "
        />

        {/* 🎇 부드러운 오라 */}
        <motion.div
          animate={{ opacity: [0.05, 0.15, 0.05] }}
          transition={{ repeat: Infinity, duration: 5 }}
          className={`
            absolute
            inset-0
            bg-gradient-to-r
            ${theme.gradient}
            opacity-10
            blur-3xl
          `}
        />

        <div className="relative z-10 space-y-8">

          {/* ================= SUMMARY ================= */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className={`
              text-4xl md:text-5xl   /* 🔥 기존 대비 2배 확대 */
              font-extrabold
              tracking-wide
              bg-gradient-to-r
              ${theme.textMainGradient}
              bg-clip-text
              text-transparent
            `}
          >
            {sentence.summary}
          </motion.div>

          {/* ================= DESCRIPTION ================= */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={`
              text-xl md:text-2xl   /* 🔥 확대 */
              leading-relaxed
              ${theme.textSub}
            `}
          >
            {sentence.description}
          </motion.div>

          {/* ================= TENDENCY ================= */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="flex items-center gap-4"
          >
            <span className="text-sm uppercase tracking-widest text-neutral-400">
              MARKET TENDENCY
            </span>

            <motion.span
              whileHover={{ scale: 1.05 }}
              className={`
                px-6
                py-2
                rounded-full
                text-base
                font-semibold
                bg-gradient-to-r
                ${theme.gradient}
                text-black
                shadow-lg
              `}
            >
              {sentence.tendency}
            </motion.span>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
