'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RealtimeStatusBadge } from './RealtimeStatusBadge'
import { StreamQualityBadge } from './StreamQualityBadge'
import { playHaptic, HapticLevel } from '@/lib/haptics/haptic'

type Status = 'connecting' | 'open' | 'error' | 'closed'

export function MobileRealtimeHUD({
  sseStatus,
  wsStatus,
}: {
  sseStatus: Status
  wsStatus?: Status
}) {
  const [open, setOpen] = useState(false)
  const [haptic, setHaptic] = useState<HapticLevel>('SOFT')

  return (
    /* ❗ pointer-events-none 제거 */
    <div className="md:hidden">
      {/* ===============================
        Floating Button
      ================================ */}
      {!open && (
        <motion.button
          type="button"
          onTap={() => {
            playHaptic(haptic)
            setOpen(true)
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="
            fixed bottom-4 left-1/2 -translate-x-1/2
            px-4 py-2 rounded-full
            shadow-lg
            bg-[#0B0F1A]/90 backdrop-blur
            text-[#D1D4DC] text-xs
            flex gap-3 items-center
            z-50
          "
        >
          <RealtimeStatusBadge sse={sseStatus} ws={wsStatus} />
        </motion.button>
      )}

      {/* ===============================
        Bottom Sheet
      ================================ */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ y: 240 }}
            animate={{ y: 0 }}
            exit={{ y: 240 }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 240 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100) {
                playHaptic(haptic)
                setOpen(false)
              }
            }}
            className="
              fixed bottom-0 left-0 right-0
              bg-[#0B0F1A]
              text-[#D1D4DC]
              rounded-t-2xl
              p-4
              z-50
            "
          >
            <div className="text-xs opacity-60 mb-3">
              아래로 스와이프하여 닫기
            </div>

            <div className="flex justify-between items-center mb-4">
              <RealtimeStatusBadge sse={sseStatus} ws={wsStatus} />
              <StreamQualityBadge />
            </div>

            <div className="flex gap-2 text-xs">
              {(['OFF', 'SOFT', 'STRONG'] as HapticLevel[]).map(lv => (
                <button
                  key={lv}
                  type="button"
                  onClick={() => setHaptic(lv)}
                  className={`px-3 py-1 rounded-md transition ${
                    haptic === lv
                      ? 'bg-white text-black'
                      : 'bg-white/10 text-[#D1D4DC]'
                  }`}
                >
                  {lv}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
