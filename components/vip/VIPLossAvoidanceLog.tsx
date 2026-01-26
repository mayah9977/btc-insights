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

type DailyAvoidedLossSummary = {
  text: string
  extremeCount: number
  highCount: number
  totalAvoidedLossUSD: number
}

export default function VIPLossAvoidanceLog() {
  const [events, setEvents] = useState<RiskEvent[]>([])
  const [summary, setSummary] =
    useState<DailyAvoidedLossSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/vip/loss-log').then((r) => r.json()),
      fetch('/api/vip/daily-avoided-loss-summary').then((r) =>
        r.ok ? r.json() : null,
      ),
    ])
      .then(([eventsData, summaryData]) => {
        setEvents(eventsData ?? [])
        setSummary(summaryData?.summary ?? null)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading || events.length === 0) {
    return null
  }

  return (
    <section className="space-y-4">
      {/* 🔹 오늘 요약 */}
      {summary && (
        <div className="rounded-2xl border border-vipBorder bg-vipCard p-5">
          <div className="text-sm text-zinc-400">
            오늘 VIP 손실 회피 요약
          </div>

          <div className="mt-2 text-lg font-bold text-white">
            EXTREME {summary.extremeCount}회 ·
            HIGH {summary.highCount}회 회피
          </div>

          <div className="mt-1 text-vipSafe text-xl font-semibold">
            +$
            {summary.totalAvoidedLossUSD.toLocaleString()}
            <span className="ml-1 text-sm text-zinc-400">
              추정 손실 방어
            </span>
          </div>
        </div>
      )}

      {/* 🔹 상세 로그 */}
      {events.map((e, i) => {
        const avoidedLossUSD = Math.abs(
          e.worstPrice - e.entryPrice,
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
    </section>
  )
}
