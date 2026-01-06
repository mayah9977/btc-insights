'use client'

import { useRealtimeAlert } from '@/lib/realtime/useRealtimeAlert'

export function RealtimeAlertStatus() {
  const {
    price,
    openInterest,
    status,
    connected,
  } = useRealtimeAlert()

  return (
    <div className="rounded border p-3 space-y-1">
      <div>
        <b>SSE:</b>{' '}
        {connected ? 'CONNECTED' : 'WAITING'}
      </div>

      <div>
        <b>PRICE:</b>{' '}
        {price ? price.toLocaleString() : '-'}
      </div>

      <div>
        <b>OI:</b>{' '}
        {openInterest
          ? openInterest.toLocaleString()
          : '-'}
      </div>

      <div>
        <b>ALERT STATE:</b> {status}
      </div>
    </div>
  )
}
