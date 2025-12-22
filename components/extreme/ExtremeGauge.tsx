'use client';

import { motion } from 'framer-motion';

export function ExtremeGauge({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, score));

  const color =
    pct >= 90
      ? 'bg-red-600'
      : pct >= 70
      ? 'bg-orange-500'
      : 'bg-green-600';

  return (
    <div className="w-40">
      <div className="h-2 bg-gray-200 rounded overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4 }}
          className={`h-full ${color}`}
        />
      </div>
      <div className="text-xs mt-1 opacity-70">
        Extreme Score {pct}
      </div>
    </div>
  );
}
