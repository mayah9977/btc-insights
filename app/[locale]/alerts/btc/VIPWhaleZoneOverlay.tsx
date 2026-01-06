'use client'

import { useEffect, useState } from 'react'
import clsx from 'clsx'

type Props = {
  price: number | null
}

const WHALE_START = 95_000
const WHALE_END = 90_000

export default function VIPWhaleZoneOverlay({ price }: Props) {
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (price === null) return
    setActive(price <= WHALE_START && price >= WHALE_END)
  }, [price])

  if (!active) return null

  const intensity =
    price && price <= 92_000 ? 'strong' : 'medium'

  return (
    <div className="pointer-events-none fixed inset-0 z-[99990]">
      <div
        className={clsx(
          'absolute inset-0',
          intensity === 'strong'
            ? 'bg-red-900/25 animate-pulse'
            : 'bg-amber-700/15',
        )}
      />

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 rounded-2xl border border-yellow-500/40 bg-black/80 px-6 py-4 text-center shadow-[0_0_40px_rgba(245,158,11,0.45)]">
        <div className="text-xs font-extrabold tracking-widest text-yellow-400">
          VIP WHALE ZONE
        </div>
        <div className="mt-1 text-lg font-black text-yellow-300">
          {price?.toLocaleString()} USDT
        </div>
        <div className="mt-1 text-xs text-yellow-200/80">
          고래 매집 · 고위험 구간
        </div>
      </div>
    </div>
  )
}
