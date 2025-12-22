'use client';

import { motion } from 'framer-motion';
import { getExtremeHistory, getAverageReliability } from '@/lib/extreme/extremeHistoryStore';

export function VIP3ReliabilityGraph() {
  const data = getExtremeHistory();
  const avg = getAverageReliability();

  return (
    <div className="p-4">
      <h4 className="text-sm font-semibold mb-2">
        Extreme 신뢰도 추이
      </h4>

      <div className="flex items-end gap-1 h-20">
        {data.map((d, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${d.reliability * 100}%` }}
            className="w-1 bg-blue-500 rounded"
          />
        ))}
      </div>

      <div className="text-xs opacity-70 mt-2">
        평균 신뢰도: {(avg * 100).toFixed(1)}%
      </div>
    </div>
  );
}
