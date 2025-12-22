'use client';

import { useDangerZoneLog } from '../../lib/dangerZoneLogStore';
import { backtestRiskWinRate } from '../../lib/riskBacktest';

export default function RiskBacktestPage() {
  const { logs } = useDangerZoneLog();
  const results = backtestRiskWinRate(logs);

  return (
    <main className="p-6 bg-black text-white min-h-screen space-y-4">
      <h1 className="text-3xl font-bold">
        📊 Risk → Win Rate Backtest
      </h1>

      <table className="w-full text-sm border border-neutral-800">
        <thead className="bg-neutral-900">
          <tr>
            <th className="p-2">Risk</th>
            <th className="p-2">Samples</th>
            <th className="p-2">Est. Win Rate</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr key={r.bucket} className="border-t border-neutral-800">
              <td className="p-2">{r.bucket}</td>
              <td className="p-2">{r.count}</td>
              <td className="p-2">
                {(r.estimatedWinRate * 100).toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
