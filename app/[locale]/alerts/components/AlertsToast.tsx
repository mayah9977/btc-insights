'use client'

import { useEffect, useState } from 'react'
import clsx from 'clsx'

/* =========================
 * Types
 * ========================= */
export type Toast = {
  id: string
  symbol: string
  price: number
  ts: number
}

/* =========================
 * 🔔 External Toast Trigger
 * ========================= */
export function emitToast(toast: Toast) {
  if (typeof window === 'undefined') return

  window.dispatchEvent(
    new CustomEvent<Toast>('alert:triggered', {
      detail: toast,
    }),
  )
}

/* =========================
 * 🔔 Toast UI
 * ========================= */
export default function AlertsToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const handler = (e: Event) => {
      const { detail } = e as CustomEvent<Toast>

      // ✅ 중복 toast 방지 (alert id 기준)
      setToasts(prev => {
        if (prev.some(t => t.id === detail.id)) return prev
        return [...prev, detail]
      })

      // ⏱ 자동 제거
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== detail.id))
      }, 3500)
    }

    window.addEventListener('alert:triggered', handler)
    return () => window.removeEventListener('alert:triggered', handler)
  }, [])

  if (!toasts.length) return null

  return (
    <div className="fixed top-6 right-6 z-50 space-y-3">
      {toasts.map(t => (
        <div
          key={`${t.id}-${t.ts}`} // ✅ React 경고 완전 제거
          className={clsx(
            'px-4 py-3 rounded-xl shadow-lg',
            'bg-gradient-to-r from-indigo-500 to-purple-600',
            'text-white text-sm font-medium',
            'animate-slide-in',
          )}
        >
          🔔 {t.symbol} triggered @ {t.price.toLocaleString()}
        </div>
      ))}
    </div>
  )
}
