'use client'

import { useState } from 'react'
import { useAlertsStore } from '@/app/[locale]/alerts/providers/alertsStore.zustand'
import type { PriceAlert } from '@/lib/alerts/alertStore.types'

export default function CreateAlertModal({
  onClose,
}: {
  onClose: () => void
}) {
  const [price, setPrice] = useState(112000)
  const [condition, setCondition] =
    useState<'ABOVE' | 'BELOW'>('ABOVE')
  const [level, setLevel] =
    useState<'NORMAL' | 'CRITICAL'>('NORMAL')
  const [loading, setLoading] = useState(false)

  /** ✅ selector 타입 안전하게 */
  const addAlert = useAlertsStore(s => s.addAlert)

  const submit = async () => {
    if (loading) return
    setLoading(true)

    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: 'BTCUSDT',

          /* 🔔 Alert Engine 필수 */
          condition,          // ABOVE | BELOW
          targetPrice: price, // 기준 가격
          repeatMode: 'ONCE',

          /* UI / Push 메타 */
          level,              // NORMAL | CRITICAL
        }),
      })

      if (!res.ok) {
        throw new Error('Alert creation failed')
      }

      const data: { ok: boolean; alert?: PriceAlert } =
        await res.json()

      if (data.ok && data.alert) {
        // 🔥 핵심: POST 직후 UI Store 즉시 반영
        addAlert(data.alert)
      }

      onClose()
    } catch (e) {
      console.error('[CREATE_ALERT]', e)
      alert('알림 생성 실패')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-neutral-900 p-6 rounded-lg w-96 space-y-4">
        <h2 className="text-lg font-bold">새 알림 생성</h2>

        {/* 가격 */}
        <div>
          <label className="block text-sm mb-1">가격</label>
          <input
            type="number"
            value={price}
            onChange={e => setPrice(Number(e.target.value))}
            className="w-full px-3 py-2 rounded bg-neutral-800"
          />
        </div>

        {/* 조건 */}
        <div>
          <label className="block text-sm mb-1">알림 조건</label>
          <select
            value={condition}
            onChange={e =>
              setCondition(e.target.value as 'ABOVE' | 'BELOW')
            }
            className="w-full px-3 py-2 rounded bg-neutral-800"
          >
            <option value="ABOVE">가격 이상</option>
            <option value="BELOW">가격 이하</option>
          </select>
        </div>

        {/* 중요도 */}
        <div>
          <label className="block text-sm mb-1">중요도</label>
          <select
            value={level}
            onChange={e =>
              setLevel(e.target.value as 'NORMAL' | 'CRITICAL')
            }
            className="w-full px-3 py-2 rounded bg-neutral-800"
          >
            <option value="NORMAL">NORMAL</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
        </div>

        {/* 버튼 */}
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} disabled={loading}>
            취소
          </button>
          <button
            onClick={submit}
            disabled={loading}
            className="bg-yellow-500 px-4 py-1 rounded text-black font-bold disabled:opacity-50"
          >
            {loading ? '생성 중…' : '생성'}
          </button>
        </div>
      </div>
    </div>
  )
}
