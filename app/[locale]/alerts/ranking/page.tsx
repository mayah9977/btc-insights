'use client'

import { useEffect, useState } from 'react'

export default function AlertRankingPage() {
  const [rows, setRows] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/alerts/ranking')
      .then(r => r.json())
      .then(setRows)
  }, [])

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">알림 성과 랭킹</h1>

      <table className="w-full border text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th>순위</th>
            <th>심볼</th>
            <th>적중률</th>
            <th>평균 수익률</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.alertId} className="border-t text-center">
              <td>{i + 1}</td>
              <td>{r.symbol}</td>
              <td>{(r.hitRate * 100).toFixed(1)}%</td>
              <td>{r.avgPnL.toFixed(2)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
