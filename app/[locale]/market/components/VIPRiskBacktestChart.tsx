'use client';

type Props = {
  total: number;
  wins: number;
};

export default function VIPRiskBacktestChart({ total, wins }: Props) {
  const rate = total === 0 ? 0 : Math.round((wins / total) * 100);

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
      <h3 className="font-bold mb-2">📈 실제 승률 백테스트</h3>

      <div className="h-3 bg-neutral-800 rounded overflow-hidden">
        <div
          className={`h-full ${
            rate >= 60
              ? 'bg-green-500'
              : rate >= 40
              ? 'bg-yellow-400'
              : 'bg-red-500'
          }`}
          style={{ width: `${rate}%` }}
        />
      </div>

      <p className="text-xs text-neutral-400 mt-2">
        승률 {rate}% ({wins}/{total})
      </p>
    </div>
  );
}
