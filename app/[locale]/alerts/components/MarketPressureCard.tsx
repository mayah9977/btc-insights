'use client'

import clsx from 'clsx'
import TiltCard from './TiltCard'
import { useRealtimePrice } from '@/lib/realtime/useRealtimePrice'

export default function MarketPressureCard({
  symbol = 'BTCUSDT',
}: {
  symbol?: string
}) {
  const { price, prevPrice } = useRealtimePrice(symbol)

  /** 📈 가격 변동률 기반 Pressure */
  const change =
    price && prevPrice
      ? (price - prevPrice) / prevPrice
      : null

  const score =
    change != null
      ? Math.min(1, Math.abs(change) * 50)
      : null

  const direction =
    score == null
      ? 'NEUTRAL'
      : change! > 0
      ? 'BULL'
      : 'BEAR'

  return (
    <TiltCard>
      <div
        className={clsx(
          'relative overflow-hidden rounded-2xl border px-6 py-5',
          'bg-gradient-to-br from-indigo-500/10 via-transparent to-slate-500/5',
          direction === 'BULL' && 'border-emerald-400/30',
          direction === 'BEAR' && 'border-rose-400/30',
          direction === 'NEUTRAL' && 'border-white/10',
        )}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 tracking-wider">
              MARKET MOMENTUM
            </div>
            <div className="mt-1 text-lg font-semibold text-white">
              {symbol}
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-400">
              Last Price
            </div>
            <div className="text-2xl font-bold text-white">
              {price ? price.toLocaleString() : '—'}
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Momentum
          </div>
          <div
            className={clsx(
              'text-sm font-semibold',
              direction === 'BULL' && 'text-emerald-400',
              direction === 'BEAR' && 'text-rose-400',
              direction === 'NEUTRAL' && 'text-slate-400',
            )}
          >
            {score != null
              ? `${(score * 100).toFixed(1)}%`
              : '—'}
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-px bg-white/10" />
      </div>
    </TiltCard>
  )
}
