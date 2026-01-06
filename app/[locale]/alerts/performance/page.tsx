'use client'

import { useEffect, useState } from 'react'

export default function AlertsPerformancePage() {
  const [rows, setRows] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/alerts/performance')
      .then(r => r.json())
      .then(setRows)
  }, [])

  const hitRate =
    rows.length === 0
      ? 0
      : Math.round(
          (rows.filter(r => r.hit).length / rows.length) * 100
        )

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">알림 성과 분석</h1>

      <div className="grid grid-cols-3 gap-4">
        <Stat label="총 알림" value={rows.length} />
        <Stat label="적중률" value={`${hitRate}%`} />
        <Stat
          label="누적 PnL"
          value={`${rows
            .reduce((s, r) => s + (r.pnlPercent ?? 0), 0)
            .toFixed(2)}%`}
        />
      </div>

      <table className="w-full text-sm border">
        <thead className="bg-gray-50">
          <tr>
            <th>심볼</th>
            <th>진입가</th>
            <th>청산가</th>
            <th>수익률</th>
            <th>결과</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id} className="border-t text-center">
              <td>{r.symbol}</td>
              <td>{r.entryPrice}</td>
              <td>{r.exitPrice ?? '-'}</td>
              <td>
                {r.pnlPercent?.toFixed(2) ?? '-'}%
              </td>
              <td>
                {r.hit === null
                  ? '진행중'
                  : r.hit
                  ? '적중'
                  : '실패'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Stat({ label, value }: any) {
  return (
    <div className="bg-white border rounded-xl p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  )
}
