'use client'

import { useEffect, useState } from 'react'

type AlertHistory = {
  id: string
  symbol: string
  condition: string
  price: number
  percent?: number
  triggeredAt: number
}

export default function AlertHistoryPage() {
  const [items, setItems] = useState<AlertHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/alerts/history', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        setItems(data.histories ?? data ?? [])
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-8 text-gray-100">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          📊 알림 성과 리포트
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          트리거된 알림 기록과 성과 요약
        </p>
      </div>

      {/* Empty */}
      {!loading && items.length === 0 && (
        <div className="text-center text-gray-500 py-20">
          아직 발생한 알림이 없습니다.
        </div>
      )}

      {/* List */}
      <div className="space-y-4">
        {items.map(h => (
          <div
            key={h.id}
            className="flex justify-between items-center rounded-2xl
                       bg-[#0f131a] border border-white/10
                       px-6 py-5 hover:border-white/20
                       hover:shadow-xl transition"
          >
            {/* Left */}
            <div className="space-y-1">
              <div className="font-semibold tracking-wide">
                {h.symbol}
              </div>

              <div className="text-sm text-gray-400">
                {renderCondition(h)}
              </div>
            </div>

            {/* Right */}
            <div className="text-right space-y-1">
              <div className="text-lg font-semibold">
                {h.price.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">
                {new Date(h.triggeredAt).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* =========================
 * Condition Label Helper
 * ========================= */
function renderCondition(h: AlertHistory) {
  switch (h.condition) {
    case 'ABOVE':
      return '가격 돌파 (상승)'
    case 'BELOW':
      return '가격 이탈 (하락)'
    case 'PERCENT_UP':
      return `현재가 대비 ${h.percent}% 이상 상승`
    case 'PERCENT_DOWN':
      return `현재가 대비 ${h.percent}% 이상 하락`
    default:
      return h.condition
  }
}
