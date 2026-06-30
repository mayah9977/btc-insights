'use client';

type Report = {
  summary: string;
  totalEvents: number;
  breakdown: {
    high: number;
    medium: number;
    low: number;
  };
  extremeMode: boolean;
  generatedAt: string;
};

export default function VIPSessionReportCard({
  report,
}: {
  report: Report;
}) {
  return (
    <div
      className={`rounded-xl border p-5 ${
        report.extremeMode
          ? 'border-red-500 bg-red-500/10'
          : 'border-neutral-800 bg-neutral-900'
      }`}
    >
      <h2 className="text-xl font-bold mb-3">
        📄 VIP 세션 리포트
      </h2>

      <div className="text-sm text-neutral-300 space-y-1">
        <div>{report.summary}</div>
        <div>
          HIGH {report.breakdown.high} · MEDIUM{' '}
          {report.breakdown.medium} · LOW {report.breakdown.low}
        </div>
        <div className="text-xs text-neutral-500">
          생성 시각: {report.generatedAt || '-'}
        </div>
      </div>
    </div>
  );
}
