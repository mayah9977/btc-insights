'use client';

import { useMemo, useEffect, useState } from 'react';
import { useWhaleHistory } from '../lib/whaleHistoryStore';
import VIPSessionReportCard from '../components/VIPSessionReportCard';
import VIPWhaleHeatmap from '../components/VIPWhaleHeatmap';
import { useExtremeTheme } from '../lib/extremeThemeStore';
import type { VIPLevel } from '../lib/vipAccess';

type Props = {
  vipLevel: VIPLevel;
};

export default function VIPClientPage({ vipLevel }: Props) {
  const { logs } = useWhaleHistory();
  const { extreme } = useExtremeTheme();

  // hydration-safe timestamp
  const [mountedAt, setMountedAt] = useState('');
  useEffect(() => {
    setMountedAt(new Date().toISOString());
  }, []);

  const report = useMemo(() => {
    const breakdown = { high: 0, medium: 0, low: 0 };
    logs.forEach((l) => {
      if (l.intensity === 'HIGH') breakdown.high++;
      else if (l.intensity === 'MEDIUM') breakdown.medium++;
      else breakdown.low++;
    });

    return {
      summary: `총 ${logs.length}건 고래 이벤트`,
      totalEvents: logs.length,
      breakdown,
      extremeMode: extreme,
      generatedAt: mountedAt,
    };
  }, [logs, extreme, mountedAt]);

  return (
    <main
      className={`min-h-screen p-6 space-y-6 text-white ${
        extreme ? 'bg-red-950/30' : 'bg-black'
      }`}
    >
      <header>
        <h1 className="text-3xl font-extrabold">
          👑 VIP 대시보드
        </h1>
        <p className="text-sm text-neutral-400">
          현재 등급: <b>{vipLevel}</b>
        </p>
        {extreme && (
          <p className="text-red-400 font-bold mt-1">
            🔥 EXTREME MODE (VIP3 서버 강제)
          </p>
        )}
      </header>

      <section>
        <VIPWhaleHeatmap vipLevel={vipLevel} />
      </section>

      <section>
        <VIPSessionReportCard report={report} />
      </section>
    </main>
  );
}
