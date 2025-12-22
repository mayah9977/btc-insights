'use client';

import { getStreamQuality } from '@/lib/realtime/streamQualityMonitor';

export function StreamQualityBadge() {
  const { dropRate } = getStreamQuality();

  const color =
    dropRate < 0.05
      ? 'green'
      : dropRate < 0.15
      ? 'orange'
      : 'red';

  return (
    <span style={{ fontSize: 12, color }}>
      Drop {(dropRate * 100).toFixed(1)}%
    </span>
  );
}
