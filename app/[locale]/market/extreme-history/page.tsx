'use client';

import {
  getExtremeHistory,
  getAverageReliability,
} from '@/lib/extreme/extremeHistoryStore';
import { ExtremeHistoryGraph } from '@/components/extreme/ExtremeHistoryGraph';

export default function ExtremeReliabilityHistoryPage() {
  const history = getExtremeHistory();
  const avg = getAverageReliability();

  return (
    <main className="p-4 space-y-4">
      {/* Header */}
      <header>
        <h1 className="text-lg font-bold">
          Extreme Reliability History
        </h1>
        <p className="text-sm text-gray-500">
          Extreme 이벤트 신뢰도 흐름 (최근 {history.length}건)
        </p>
      </header>

      {/* 평균 신뢰도 */}
      <section className="p-3 rounded border bg-gray-50">
        <div className="text-sm">
          평균 신뢰도{' '}
          <strong>
            {(avg * 100).toFixed(1)}%
          </strong>
        </div>
      </section>

      {/* 히스토리 그래프 (Framer Motion) */}
      <section className="border rounded p-3">
        {history.length === 0 ? (
          <div className="text-sm text-gray-400">
            아직 Extreme 데이터가 없습니다.
          </div>
        ) : (
          <ExtremeHistoryGraph data={history} />
        )}
      </section>

      {/* 타임라인 리스트 */}
      <section className="border rounded p-3">
        <h2 className="text-sm font-semibold mb-2">
          Recent Records
        </h2>

        <ul className="text-xs space-y-1">
          {history
            .slice()
            .reverse()
            .map((h, i) => (
              <li
                key={i}
                className="flex justify-between text-gray-600"
              >
                <span>
                  {new Date(h.at).toLocaleTimeString()}
                </span>
                <span>
                  {(h.reliability * 100).toFixed(1)}%
                </span>
              </li>
            ))}
        </ul>
      </section>
    </main>
  );
}
