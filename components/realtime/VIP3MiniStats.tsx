'use client';

export function VIP3MiniStats({
  sse,
  ws,
  dropRate,
}: {
  sse: 'connecting' | 'open' | 'error' | 'closed';
  ws?: 'connecting' | 'open' | 'error' | 'closed';
  dropRate: number;
}) {
  return (
    <div className="text-xs opacity-80 mt-2">
      <div>📡 SSE: {sse}</div>
      {ws && <div>⚡ WS: {ws}</div>}
      <div>
        📉 Drop: {(dropRate * 100).toFixed(1)}%
      </div>
    </div>
  );
}
