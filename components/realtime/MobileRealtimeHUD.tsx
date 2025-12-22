'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RealtimeStatusBadge } from './RealtimeStatusBadge';
import { StreamQualityBadge } from './StreamQualityBadge';
import { playHaptic, HapticLevel } from '@/lib/haptics/haptic';

export function MobileRealtimeHUD({
  sseStatus,
  wsStatus,
}: {
  sseStatus: 'connecting' | 'open' | 'error' | 'closed';
  wsStatus?: 'connecting' | 'open' | 'error' | 'closed';
}) {
  const [open, setOpen] = useState(false);
  const [haptic, setHaptic] =
    useState<HapticLevel>('SOFT');

  return (
    <div className="md:hidden">
      {!open && (
        <motion.div
          onTap={() => {
            playHaptic(haptic);
            setOpen(true);
          }}
          className="
            fixed bottom-4 left-1/2 -translate-x-1/2
            px-4 py-2 rounded-full shadow-lg
            bg-black text-white text-xs
            flex gap-3 items-center
            z-50
          "
        >
          <RealtimeStatusBadge sse={sseStatus} ws={wsStatus} />
        </motion.div>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ y: 200 }}
            animate={{ y: 0 }}
            exit={{ y: 200 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 200 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 80) {
                playHaptic(haptic);
                setOpen(false);
              }
            }}
            className="
              fixed bottom-0 left-0 right-0
              bg-black text-white
              rounded-t-xl p-4
              z-50
            "
          >
            <div className="text-xs opacity-60 mb-2">
              아래로 스와이프하여 닫기
            </div>

            <div className="flex justify-between items-center mb-3">
              <RealtimeStatusBadge
                sse={sseStatus}
                ws={wsStatus}
              />
              <StreamQualityBadge />
            </div>

            {/* 햅틱 강도 선택 */}
            <div className="flex gap-2 text-xs">
              {(['OFF', 'SOFT', 'STRONG'] as HapticLevel[]).map(
                (lv) => (
                  <button
                    key={lv}
                    onClick={() => setHaptic(lv)}
                    className={`px-2 py-1 rounded ${
                      haptic === lv
                        ? 'bg-white text-black'
                        : 'bg-gray-700'
                    }`}
                  >
                    {lv}
                  </button>
                )
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
