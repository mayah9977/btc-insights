'use client'

import { motion } from 'framer-motion'
import { RealtimeStatusBadge } from './RealtimeStatusBadge'
import { StreamQualityBadge } from './StreamQualityBadge'

export function AdvancedRealtimeHeader({
  sseStatus,
  wsStatus,
}: {
  sseStatus: 'connecting' | 'open' | 'error' | 'closed'
  wsStatus?: 'connecting' | 'open' | 'error' | 'closed'
}) {
  return (
    <motion.div
      initial={{ y: -8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="
        sticky top-0 z-40 w-full
        flex items-center gap-3
        px-4 py-2
        border-b border-white/10
        bg-[#0B0F1A]/80
        backdrop-blur-md
        text-[#D1D4DC]
      "
    >
      <span className="text-sm font-semibold tracking-tight">Realtime</span>
      <RealtimeStatusBadge sse={sseStatus} ws={wsStatus} />
      <StreamQualityBadge />
    </motion.div>
  )
}
