'use client'

import clsx from 'clsx'
import { useRealtimeMarket } from '@/lib/realtime/useRealtimeMarket'

type Preset = {
  label: string
  price: number
  tone: 'gold' | 'blue' | 'red'
}

type Props = {
  disabled?: boolean
}

const PRESETS: Preset[] = [
  { label: '112K BREAKOUT', price: 112_000, tone: 'gold' },
  { label: '105K SUPPORT', price: 105_000, tone: 'blue' },
  { label: '98K CRITICAL', price: 98_000, tone: 'red' },
]

export default function BTCPricePresets({ disabled = false }: Props) {
  const market = useRealtimeMarket()
  const currentPrice = market.price

  const createAlert = async (price: number) => {
    if (disabled) return

    // ✅ 이미 돌파된 경우 프론트 경고
    if (typeof currentPrice === 'number' && currentPrice >= price) {
      const isCritical = price <= 98_000

      const ok = window.confirm(
        isCritical
          ? `⚠️ CRITICAL PRICE ZONE\n\n현재 BTC 가격은 이미 ${price.toLocaleString()} USDT 이상입니다.\n즉시 알림이 발생할 수 있습니다.\n\n정말 생성하시겠습니까?`
          : `현재 BTC 가격은 이미 ${price.toLocaleString()} USDT 이상입니다.\n알림은 즉시 발생할 수 있습니다.\n\n그래도 생성하시겠습니까?`,
      )

      if (!ok) return
    }

    try {
      await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: 'BTCUSDT',
          condition: 'ABOVE',
          targetPrice: price,
          repeatMode: 'REPEAT',
          cooldownMs: 60_000,
        }),
      })
    } catch (e) {
      console.error('[BTC PRESET CREATE FAILED]', e)
      window.alert('알림 생성에 실패했습니다.')
    }
  }

  return (
    <div
      className={clsx(
        'grid grid-cols-1 gap-3',
        disabled && 'opacity-40 pointer-events-none',
      )}
    >
      {PRESETS.map(preset => {
        const alreadyHit =
          typeof currentPrice === 'number' && currentPrice >= preset.price

        return (
          <button
            key={preset.price}
            type="button"
            onClick={() => createAlert(preset.price)}
            className={clsx(
              'relative h-16 rounded-2xl px-5 text-left',
              'flex items-center justify-between',
              'border transition-all active:scale-[0.97]',
              alreadyHit && 'ring-2 ring-red-500/40',
              preset.tone === 'gold' &&
                'border-yellow-400/40 bg-gradient-to-r from-yellow-500/20 to-amber-400/10 text-yellow-300 shadow-[0_0_30px_rgba(251,191,36,0.35)]',
              preset.tone === 'blue' &&
                'border-indigo-400/30 bg-gradient-to-r from-indigo-500/20 to-sky-400/10 text-indigo-200 shadow-[0_0_30px_rgba(99,102,241,0.35)]',
              preset.tone === 'red' &&
                'border-red-500/30 bg-gradient-to-r from-red-500/20 to-rose-400/10 text-red-300 shadow-[0_0_36px_rgba(239,68,68,0.45)]',
            )}
          >
            <div>
              <div className="text-xs font-bold tracking-widest opacity-80">
                BTC PRESET
              </div>
              <div className="text-lg font-extrabold">
                {preset.price.toLocaleString()} USDT
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs font-bold opacity-70">
                {preset.label}
              </div>

              {alreadyHit && (
                <div className="mt-1 text-[10px] font-bold text-red-400">
                  ALREADY HIT
                </div>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
