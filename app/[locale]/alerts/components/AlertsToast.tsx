'use client'

import { useEffect, useState } from 'react'
import clsx from 'clsx'

export type Toast = {
  id: string
  symbol: string
  price: number
}

/** 🔔 외부에서 호출하는 Toast 트리거 */
export function emitToast(toast: Toast) {
  window.dispatchEvent(
    new CustomEvent<Toast>('alert:triggered', {
      detail: toast,
    }),
  )
}

export default function AlertsToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const handler = (e: Event) => {
      const { detail } = e as CustomEvent<Toast>
      setToasts(prev => [...prev, detail])

      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== detail.id))
      }, 3500)
    }

    window.addEventListener('alert:triggered', handler)
    return () => window.removeEventListener('alert:triggered', handler)
  }, [])

  return (
    <div className="fixed top-6 right-6 z-50 space-y-3">
      {toasts.map(t => (
        <div
          key={t.id}
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
