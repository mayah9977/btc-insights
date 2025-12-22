'use client';

import { useEffect, useMemo, useState } from 'react';

type Report = {
  summary: string;
  generatedAt: string;
  breakdown: { high: number; medium: number; low: number };
  tag?: string;
  version?: number;
  snapshot?: boolean;
};

export default function VIPSessionHistoryPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [query, setQuery] = useState('');
  const [compare, setCompare] = useState<number[]>([]);

  const load = () => {
    fetch('/api/vip/report')
      .then((r) => r.json())
      .then(setReports);
  };

  useEffect(load, []);

  const filtered = useMemo(() => {
    if (!query) return reports;
    return reports.filter(
      (r) =>
        r.tag?.includes(query) ||
        r.summary.includes(query)
    );
  }, [reports, query]);

  const toggleCompare = (idx: number) => {
    setCompare((prev) =>
      prev.includes(idx)
        ? prev.filter((i) => i !== idx)
        : prev.length < 2
        ? [...prev, idx]
        : prev
    );
  };

  const compareReports =
    compare.length === 2
      ? [filtered[compare[0]], filtered[compare[1]]]
      : null;

  return (
    <main className="p-6 bg-black text-white min-h-screen space-y-6">
      <h1 className="text-3xl font-bold">
        📚 VIP 세션 히스토리
      </h1>

      {/* 🔍 검색 */}
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by tag / summary"
        className="bg-neutral-800 px-3 py-2 rounded w-full text-sm"
      />

      {filtered.length === 0 && (
        <p className="text-neutral-400">결과 없음</p>
      )}

      {/* 📋 리스트 */}
      <ul className="space-y-3">
        {filtered.map((r, i) => {
          const selected = compare.includes(i);

          return (
            <li
              key={i}
              onClick={() => toggleCompare(i)}
              className={`cursor-pointer border rounded-xl p-4 transition ${
                selected
                  ? 'border-yellow-400 bg-yellow-400/10'
                  : 'border-neutral-800 bg-neutral-900'
              }`}
            >
              <div className="flex justify-between">
                <div>
                  <div className="font-bold">
                    {r.summary}{' '}
                    {r.version && (
                      <span className="text-xs text-yellow-400">
                        v{r.version}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-neutral-400">
                    {r.generatedAt}
                  </div>
                </div>

                {r.snapshot && (
                  <span className="text-xs text-green-400">
                    SNAPSHOT
                  </span>
                )}
              </div>

              <div className="text-sm mt-1">
                HIGH {r.breakdown.high} · MED{' '}
                {r.breakdown.medium} · LOW{' '}
                {r.breakdown.low}
              </div>

              {r.tag && (
                <div className="text-xs text-yellow-400 mt-1">
                  #{r.tag}
                </div>
              )}

              {selected && (
                <div className="text-xs text-yellow-300 mt-2">
                  비교 대상 선택됨
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* 📊 비교 뷰 */}
      {compareReports && (
        <section className="border border-red-500 bg-red-500/10 rounded-xl p-4">
          <h2 className="font-bold mb-3">
            🔍 VIP 세션 비교
          </h2>

          <div className="grid grid-cols-2 gap-4 text-sm">
            {compareReports.map((r, idx) => (
              <div
                key={idx}
                className="border border-neutral-800 bg-neutral-900 rounded p-3"
              >
                <div className="font-bold mb-1">
                  {r.summary}
                </div>
                <div className="text-xs text-neutral-400 mb-2">
                  {r.generatedAt}
                </div>
                <div>
                  HIGH {r.breakdown.high}
                </div>
                <div>
                  MEDIUM {r.breakdown.medium}
                </div>
                <div>
                  LOW {r.breakdown.low}
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-neutral-400 mt-3">
            ※ 최대 2개 세션만 비교할 수 있습니다.
          </p>
        </section>
      )}
    </main>
  );
}
