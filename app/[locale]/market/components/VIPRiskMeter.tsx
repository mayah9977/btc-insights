'use client';

type Props = {
  probability: number; // 0~1
};

export default function VIPRiskMeter({ probability }: Props) {
  const pct = Math.round(probability * 100);

  const color =
    pct >= 70
      ? 'bg-red-500'
      : pct >= 40
      ? 'bg-yellow-400'
      : 'bg-green-400';

  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-neutral-400">
          VIP Risk Meter
        </span>
        <span className="font-bold">{pct}%</span>
      </div>

      <div className="h-2 bg-neutral-800 rounded overflow-hidden">
        <div
          className={`h-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
