'use client';

import { useEffect, useState } from 'react';

export default function VIPSnapshotTimeline() {
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/vip/report')
      .then((r) => r.json())
      .then((all) =>
        setReports(all.filter((r: any) => r.snapshot))
      );
  }, []);

  return (
    <main className="p-6 bg-black text-white min-h-screen space-y-6">
      <h1 className="text-3xl font-bold">
        ⏱️ VIP Snapshot Timeline
      </h1>

      {reports.length === 0 && (
        <p className="text-neutral-400">스냅샷 없음</p>
      )}

      <div className="flex items-end gap-2 h-40">
        {reports.map((r, i) => {
          const height =
            r.breakdown.high * 10 +
            r.breakdown.medium * 5 +
            r.breakdown.low * 2;

          return (
            <div
              key={i}
              title={r.generatedAt}
              className="w-6 bg-red-500/70"
              style={{ height }}
            />
          );
        })}
      </div>

      <p className="text-xs text-neutral-500">
        막대 높이 = HIGH/MED/LOW 가중 합
      </p>
    </main>
  );
}
