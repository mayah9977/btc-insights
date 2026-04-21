'use client'

import { useState } from 'react'
import { useAlertsStore } from '@/app/[locale]/alerts/providers/alertsStore.zustand'
import type { PriceAlert } from '@/lib/alerts/alertStore.types'

export default function CreateAlertModal({
  onClose,
}: {
  onClose: () => void
}) {
  const [price, setPrice] = useState(() => { // 🔧 변경: localStorage 초기값 적용
    if (typeof window !== 'undefined') {
      return localStorage.getItem('alert_price') || ''
    }
    return ''
  })
  const [condition, setCondition] =
    useState<'ABOVE' | 'BELOW'>('ABOVE')
  const [loading, setLoading] = useState(false)

  /** ✅ selector 타입 안전하게 */
  const addAlert = useAlertsStore(s => s.addAlert)

  const submit = async () => {
    if (loading) return
    setLoading(true)

    try {
      localStorage.setItem('alert_price', price) // 🔧 변경: submit 시 localStorage 저장

      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: 'BTCUSDT',

          /* 🔔 Alert Engine 필수 */
          condition, // ABOVE | BELOW 유지
          targetPrice: Number(price), // 🔧 변경: submit 시 number 변환
          repeatMode: 'ONCE',
        }),
      })

      if (!res.ok) {
        throw new Error('Alert creation failed')
      }

      const data: { ok: boolean; alert?: PriceAlert } =
        await res.json()

      if (data.ok && data.alert) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-96 space-y-5 rounded-2xl bg-neutral-900 p-6 shadow-2xl transform animate-scaleIn">
        <h2 className="text-lg font-bold text-white">새 알림 생성</h2>

        {/* 가격 */}
        <div>
          <label className="mb-1 block text-sm text-gray-300">가격</label>
          <input
            type="text" // 🔧 변경: number → text
            value={price}
            onChange={e => {
              const value = e.target.value
              if (/^\d*$/.test(value)) { // 🔧 변경: 숫자만 허용
                setPrice(value)
                localStorage.setItem('alert_price', value) // 🔧 변경: 입력 시 localStorage 저장
              }
            }}
            className="w-full rounded-lg bg-neutral-800 px-3 py-2 text-white outline-none transition focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        {/* 조건 */}
        <div>
          <label className="mb-1 block text-sm text-gray-300">
            알림 조건
          </label>

          <div className="space-y-2">
            <button
              onClick={() => setCondition('ABOVE')}
              className={`w-full rounded-lg px-3 py-2 text-sm font-bold transition
                ${
                  condition === 'ABOVE'
                    ? 'bg-yellow-500 text-black'
                    : 'bg-neutral-800 text-white hover:bg-neutral-700'
                }`}
            >
              설정가격 돌파 시 (상향)
            </button>

            <button
              onClick={() => setCondition('BELOW')}
              className={`w-full rounded-lg px-3 py-2 text-sm font-bold transition
                ${
                  condition === 'BELOW'
                    ? 'bg-yellow-500 text-black'
                    : 'bg-neutral-800 text-white hover:bg-neutral-700'
                }`}
            >
              설정가격 돌파 시 (하향)
            </button>
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-lg px-4 py-2 text-sm text-gray-300 transition hover:bg-white/10 active:scale-95"
          >
            취소
          </button>

          <button
            onClick={submit}
            disabled={loading}
            className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-bold text-black transition hover:bg-yellow-400 active:scale-95 disabled:opacity-50"
          >
            {loading ? '생성 중…' : '생성'}
          </button>
        </div>
      </div>

      {/* Tailwind animation */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.25s ease-out;
        }
      `}</style>
    </div>
  )
}
