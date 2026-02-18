'use client'

import { motion, AnimatePresence } from 'framer-motion'

type Props = {
  show: boolean
  type: 'FEAR' | 'GREED' | null
}

export function VIPSentimentFlashOverlay({
  show,
  type,
}: Props) {

  const baseColor =
    type === 'FEAR'
      ? '#ef4444'
      : type === 'GREED'
      ? '#10b981'
      : 'transparent'

  const glowColor =
    type === 'FEAR'
      ? 'rgba(239,68,68,0.6)'
      : type === 'GREED'
      ? 'rgba(16,185,129,0.6)'
      : 'transparent'

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden"
        >
          {/* Base subtle color wash */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.25 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at center, ${baseColor}55 0%, transparent 70%)`,
            }}
          />

          {/* Shockwave Ring */}
          <motion.div
            initial={{ scale: 0.2, opacity: 0.8 }}
            animate={{ scale: 2.2, opacity: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div
              className="w-64 h-64 rounded-full border-[4px]"
              style={{
                borderColor: glowColor,
                boxShadow: `0 0 40px ${glowColor}`,
              }}
            />
          </motion.div>

          {/* Energy Pulse Layer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.15, 0.35, 0] }}
            transition={{ duration: 1.2 }}
            className="absolute inset-0"
            style={{
              background: `linear-gradient(
                120deg,
                transparent 0%,
                ${baseColor}33 50%,
                transparent 100%
              )`,
            }}
          />

          {/* Center Flash Burst */}
          <motion.div
            initial={{ scale: 0.4, opacity: 0.7 }}
            animate={{ scale: 1.8, opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div
              className="w-40 h-40 rounded-full"
              style={{
                background: `radial-gradient(circle, ${baseColor}99 0%, transparent 70%)`,
              }}
            />
          </motion.div>

        </motion.div>
      )}
    </AnimatePresence>
  )
}
