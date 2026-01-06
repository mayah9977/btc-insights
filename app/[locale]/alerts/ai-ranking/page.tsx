'use client'

import { useEffect, useState } from 'react'

export default function AiRankingPage() {
  const [rows, setRows] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/ai/ranking')
      .then(r => r.json())
      .then(setRows)
  }, [])

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">AI 자동매매 성과 랭킹</h1>

      <table className="w-full border text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th>순위</th>
            <th>사용자</th>
            <th>거래 수</th>
            <th>평균 수익률</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.userId} className="border-t text-center">
              <td>{i + 1}</td>
              <td>{r.userId}</td>
              <td>{r.trades}</td>
              <td>{r.avgPnL.toFixed(2)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
