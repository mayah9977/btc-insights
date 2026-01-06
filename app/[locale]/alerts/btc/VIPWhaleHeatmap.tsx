'use client'

import clsx from 'clsx'

type Props = {
  price: number | null
}

const LEVELS = [
  { price: 95_000, prob: 20 },
  { price: 93_000, prob: 40 },
  { price: 92_000, prob: 55 },
  { price: 91_000, prob: 70 },
  { price: 90_000, prob: 85 },
]

export default function VIPWhaleHeatmap({ price }: Props) {
  if (!price || price > 95_000) return null

  const current =
    LEVELS.find(l => price >= l.price) ??
    LEVELS[LEVELS.length - 1]

  return (
    <div className="rounded-2xl border border-yellow-500/30 bg-black/70 p-4 shadow-[0_0_40px_rgba(245,158,11,0.35)]">
      <div className="mb-3 text-xs font-extrabold tracking-widest text-yellow-400">
        VIP WHALE ACCUMULATION
      </div>

      <div className="space-y-2">
        {LEVELS.map(l => (
          <div
            key={l.price}
            className={clsx(
              'h-3 w-full rounded-full bg-zinc-800',
              price <= l.price &&
                'bg-gradient-to-r from-yellow-400 to-red-500',
            )}
          />
        ))}
      </div>

      <div className="mt-4 text-center">
        <div className="text-2xl font-black text-yellow-300">
          {current.prob}%
        </div>
        <div className="mt-1 text-xs text-yellow-200/80">
          고래 매집 확률
        </div>
      </div>
    </div>
  )
}
