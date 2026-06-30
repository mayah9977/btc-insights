'use client';

import { useDangerZoneLog } from '../../lib/dangerZoneLogStore';

export default function DangerZoneHistoryPage() {
  const { logs } = useDangerZoneLog();

  return (
    <main className="p-6 bg-black text-white min-h-screen space-y-4">
      <h1 className="text-3xl font-bold">🚨 Danger Zone History</h1>

      {logs.length === 0 && (
        <p className="text-neutral-400">기록 없음</p>
      )}

      <ul className="space-y-2">
        {logs.map((l, i) => (
          <li
            key={i}
            className="border border-red-500/40 bg-red-500/10 rounded p-3 flex justify-between"
          >
            <span className="font-bold">{l.symbol}</span>
            <span className="text-sm">
              {(l.probability * 100).toFixed(0)}%
            </span>
            <span className="text-xs text-neutral-400">
              {new Date(l.ts).toLocaleTimeString()}
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
