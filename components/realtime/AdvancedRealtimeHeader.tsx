'use client';

import { motion } from 'framer-motion';
import { RealtimeStatusBadge } from './RealtimeStatusBadge';
import { StreamQualityBadge } from './StreamQualityBadge';

export function AdvancedRealtimeHeader({
  sseStatus,
  wsStatus,
}: {
  sseStatus: 'connecting' | 'open' | 'error' | 'closed';
  wsStatus?: 'connecting' | 'open' | 'error' | 'closed';
}) {
  return (
    <motion.div
      initial={{ y: -8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="flex items-center gap-3 px-4 py-2 border-b bg-white dark:bg-black"
    >
      <span className="text-sm font-semibold">Realtime</span>
      <RealtimeStatusBadge sse={sseStatus} ws={wsStatus} />
      <StreamQualityBadge />
    </motion.div>
  );
}
