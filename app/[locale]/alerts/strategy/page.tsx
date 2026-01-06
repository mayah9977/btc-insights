'use client'

import { useEffect, useState } from 'react'

const LABEL: Record<string, string> = {
  STRONG_LONG: '강력 매수',
  LONG: '매수',
  WAIT: '관망',
  SHORT: '매도',
  STRONG_SHORT: '강력 매도',
}

export default function AlertStrategyPage() {
  const [rows, setRows] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/alerts/ai/strategy')
      .then(r => r.json())
      .then(setRows)
  }, [])

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">AI 포지션 전략</h1>

      <table className="w-full border text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th>심볼</th>
            <th>전략</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.alertId} className="border-t text-center">
              <td>{r.symbol}</td>
              <td className="font-semibold">{LABEL[r.strategy]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
