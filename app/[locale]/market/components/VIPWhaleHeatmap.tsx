'use client';

import clsx from 'clsx';
import { useWhaleFrequency } from '../lib/whaleFrequencyStore';
import type { VIPLevel } from '../lib/vipAccess';

type Props = {
  vipLevel: VIPLevel;
};

export default function VIPWhaleHeatmap({ vipLevel }: Props) {
  const { events } = useWhaleFrequency();

  // VIP3 → 더 촘촘하게 표시
  const maxBars = vipLevel === 'VIP3' ? 120 : vipLevel === 'VIP2' ? 90 : 60;

  return (
    <div className="bg-neutral-900 p-4 rounded-xl">
      <h2 className="font-bold mb-2">🐋 Whale Heatmap</h2>

      <div className="flex gap-[2px] items-end h-20">
        {events.slice(0, maxBars).map((e, i) => {
          const color =
            e.intensity === 'HIGH'
              ? vipLevel === 'VIP3'
                ? 'bg-red-600'
                : 'bg-red-500'
              : e.intensity === 'MEDIUM'
              ? 'bg-yellow-400'
              : 'bg-green-500';

          const height =
            e.intensity === 'HIGH'
              ? vipLevel === 'VIP3'
                ? 'h-20'
                : 'h-16'
              : e.intensity === 'MEDIUM'
              ? 'h-12'
              : 'h-8';

          return (
            <div
              key={i}
              className={clsx(
                'w-[4px] rounded-sm transition-all',
                color,
                height
              )}
            />
          );
        })}
      </div>

      {vipLevel === 'VIP3' && (
        <p className="text-xs text-red-400 mt-2">
          VIP3 전용 고밀도 / 고감도 Heatmap 활성
        </p>
      )}
    </div>
  );
}
