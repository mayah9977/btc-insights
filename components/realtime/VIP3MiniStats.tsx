'use client'

type Status = 'connecting' | 'open' | 'error' | 'closed'

export function VIP3MiniStats({
  sse,
  ws,
  dropRate,
}: {
  sse: Status
  ws?: Status
  dropRate: number
}) {
  return (
    <div
      className="
        px-4 py-2
        text-xs
        text-[#9CA3AF]
        border-b border-white/5
        bg-transparent
        flex gap-4 items-center
        select-none
      "
    >
      <span>📡 SSE: <strong className="text-[#D1D4DC]">{sse}</strong></span>

      {ws && (
        <span>⚡ WS: <strong className="text-[#D1D4DC]">{ws}</strong></span>
      )}

      <span>
        📉 Drop:{' '}
        <strong
          className={
            dropRate > 0.05
              ? 'text-red-400'
              : dropRate > 0.01
              ? 'text-yellow-400'
              : 'text-emerald-400'
          }
        >
          {(dropRate * 100).toFixed(1)}%
        </strong>
      </span>
    </div>
  )
}
