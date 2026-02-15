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
  const color =
    type === 'FEAR'
      ? 'rgba(220,38,38,0.35)'
      : type === 'GREED'
      ? 'rgba(16,185,129,0.35)'
      : 'transparent'

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[9999] pointer-events-none"
          style={{
            background: color,
          }}
        />
      )}
    </AnimatePresence>
  )
}
