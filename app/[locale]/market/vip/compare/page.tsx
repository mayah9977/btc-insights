'use client';

import { useEffect, useState } from 'react';

export default function VIPReportComparePage() {
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/vip/report')
      .then((r) => r.json())
      .then(setReports);
  }, []);

  const extreme = reports.filter((r) => r.extremeMode);

  return (
    <main className="p-6 bg-black text-white min-h-screen space-y-6">
      <h1 className="text-3xl font-bold">
        🔥 EXTREME MODE Report Comparison
      </h1>

      {extreme.length < 2 && (
        <p className="text-neutral-400">
          EXTREME 세션이 2개 이상 필요
        </p>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {extreme.slice(-2).map((r, i) => (
          <div
            key={i}
            className="border border-red-500 bg-red-500/10 rounded-xl p-4"
          >
            <div className="font-bold">{r.summary}</div>
            <div className="text-xs">{r.generatedAt}</div>

            <pre className="text-xs mt-2 text-red-300">
{JSON.stringify(r.breakdown, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </main>
  );
}
