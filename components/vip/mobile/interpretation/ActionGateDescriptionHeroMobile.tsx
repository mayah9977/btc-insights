'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { BollingerSignalType } from '@/lib/market/actionGate/signalType'
import { useTypewriter } from '@/hooks/useTypewriter'
import { useInterpretationTransition } from '@/hooks/useInterpretationTransition'
import { highlightKeywords } from '@/lib/market/actionGate/highlightKeywords'

interface Props {
  description: string
  signalType?: BollingerSignalType
}

export default function ActionGateDescriptionHeroMobile({
  description,
  signalType,
}: Props) {

  const typedText = useTypewriter(description, 12)
  const { flash } = useInterpretationTransition(signalType)

  const accent =
    signalType?.toString().includes('UPPER')
      ? 'rgba(251,191,36,0.45)'
      : signalType?.toString().includes('LOWER')
      ? 'rgba(239,68,68,0.45)'
      : 'rgba(16,185,129,0.45)'

  return (
    <motion.div
      key={description}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="relative rounded-xl border border-amber-500/20 bg-black/60 p-4"
    >

      {/* Flash */}
      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 rounded-xl"
            style={{
              background: `radial-gradient(circle, ${accent}, transparent 70%)`,
            }}
          />
        )}
      </AnimatePresence>

      {/* Glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ opacity: [0.15, 0.3, 0.15] }}
        transition={{ duration: 6, repeat: Infinity }}
        style={{
          background: `radial-gradient(circle, ${accent}, transparent 70%)`,
        }}
      />

      <p className="relative text-sm leading-relaxed text-white">
        {highlightKeywords(typedText)}
      </p>

    </motion.div>
  )
}
