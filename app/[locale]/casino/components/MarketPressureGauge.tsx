'use client'

import clsx from 'clsx'

export default function MarketPressureGauge({
  score,
  direction,
}: {
  score: number | null
  direction: 'BULL' | 'BEAR' | 'NEUTRAL'
}) {
  // 0 ~ 100 변환
  const intensity = score != null
    ? Math.min(100, Math.round(Math.abs(score) * 100))
    : 0

  const label =
    intensity >= 70 ? 'STRONG'
    : intensity >= 40 ? 'MODERATE'
    : 'WEAK'

  return (
    <div className="flex items-center gap-6">
      {/* CIRCLE */}
      <div className="relative w-24 h-24">
        <svg viewBox="0 0 36 36" className="w-full h-full">
          <path
            d="M18 2.0845
               a 15.9155 15.9155 0 0 1 0 31.831
               a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="#1f2937"
            strokeWidth="3"
          />
          <path
            d="M18 2.0845
               a 15.9155 15.9155 0 0 1 0 31.831"
            fill="none"
            stroke={
              direction === 'BULL'
                ? '#34d399'
                : direction === 'BEAR'
                ? '#fb7185'
                : '#94a3b8'
            }
            strokeWidth="3"
            strokeDasharray={`${intensity}, 100`}
          />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-white">
          {intensity}%
        </div>
      </div>

      {/* LABEL */}
      <div>
        <div
          className={clsx(
            'text-sm font-semibold',
            direction === 'BULL' && 'text-emerald-400',
            direction === 'BEAR' && 'text-rose-400',
            direction === 'NEUTRAL' && 'text-slate-400'
          )}
        >
          {label}
        </div>
        <div className="text-xs text-slate-400">
          {direction}
        </div>
      </div>
    </div>
  )
}
