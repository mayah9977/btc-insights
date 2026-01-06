'use client'

import type { PriceAlert } from '@/lib/alerts/alertStore.client'

export default function AlertItem({ alert }: { alert: PriceAlert }) {
  async function testTrigger() {
    const base = alert.targetPrice ?? 0

    await fetch('/api/debug/trigger-alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symbol: alert.symbol,
        price:
          alert.condition === 'BELOW'
            ? base - 1
            : base + 1,
      }),
    })
  }

  return (
    <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3">
      <div>
        <div className="font-medium">
          {alert.symbol} · {alert.condition}
        </div>
        <div className="text-sm text-gray-500">
          기준값: {alert.targetPrice ?? '-'}
        </div>
      </div>

      <div className="flex gap-2">
        {/* 테스트 트리거 */}
        <button
          onClick={testTrigger}
          className="px-3 py-1 rounded-lg text-xs bg-amber-500 text-black hover:bg-amber-400 transition"
        >
          테스트
        </button>
      </div>
    </div>
  )
}
