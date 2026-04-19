// /app/[locale]/alerts/components/NotificationStopButton.tsx
'use client'

import { stopNotificationLoop } from '@/lib/alerts/alertsSSEStore'

export default function NotificationStopButton() {
  return (
    <button
      onClick={() => stopNotificationLoop()}
      className="w-full rounded-xl bg-red-500 py-3 text-sm font-bold text-white hover:bg-red-400"
    >
      🔕 알림 확인
    </button>
  )
}
