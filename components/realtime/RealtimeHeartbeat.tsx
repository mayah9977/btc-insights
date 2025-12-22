'use client';

import { motion } from 'framer-motion';

export function RealtimeHeartbeat({
  active,
}: {
  active: boolean;
}) {
  if (!active) return null;

  return (
    <motion.div
      className="w-2 h-2 rounded-full bg-green-500"
      animate={{ scale: [1, 1.4, 1] }}
      transition={{
        duration: 1.6,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}
