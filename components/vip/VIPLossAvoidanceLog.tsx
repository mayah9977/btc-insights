'use client'

import { useEffect, useState } from 'react'

type RiskEvent = {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME'
  entryPrice: number
  worstPrice: number
  position: 'LONG' | 'SHORT'
  timestamp: number
  reason?: string
}

export default function VIPLossAvoidanceLog() {
  const [events, setEvents] = useState<RiskEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/vip/loss-log')
      .then((res) => res.json())
      .then((data) => setEvents(data))
      .finally(() => setLoading(false))
  }, [])

  if (loading || events.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {events.map((e, i) => {
        const avoidedLossUSD = Math.abs(
          e.worstPrice - e.entryPrice
        )

        return (
          <div
            key={`${e.timestamp}-${i}`}
            className="bg-vipCard border border-vipBorder rounded-2xl p-5"
          >
            <div className="flex justify-between items-center">
              <div className="text-sm text-zinc-400">
                {new Date(e.timestamp).toLocaleString()} ·{' '}
                {e.position}
              </div>

              <div className="text-vipSafe font-semibold">
                +${avoidedLossUSD.toLocaleString()}
              </div>
            </div>

            <div className="mt-2 text-white">
              {e.riskLevel} 리스크 감지로 진입 회피
            </div>

            {e.reason && (
              <div className="mt-1 text-sm text-zinc-400">
                사유: {e.reason}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
