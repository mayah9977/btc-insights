'use client';

import { getStableZoneLogs } from '@/lib/extreme/stableZoneLogStore';

export default function StableZoneHistoryPage() {
  const logs = getStableZoneLogs();

  return (
    <main className="p-4 space-y-4">
      <header>
        <h1 className="text-lg font-bold">
          Stable Zone History
        </h1>
        <p className="text-sm text-gray-500">
          Extreme 평균 신뢰도 기준 안정 구간 진입 기록
        </p>
      </header>

      {logs.length === 0 ? (
        <div className="text-sm text-gray-400">
          아직 Stable Zone 진입 기록이 없습니다.
        </div>
      ) : (
        <ul className="space-y-2 text-sm">
          {logs.map((l, i) => (
            <li
              key={i}
              className="flex justify-between items-center
                         border rounded px-3 py-2 bg-green-50"
            >
              <span>
                {new Date(l.at).toLocaleString()}
              </span>
              <span className="font-semibold text-green-700">
                {(l.avgReliability * 100).toFixed(1)}%
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
