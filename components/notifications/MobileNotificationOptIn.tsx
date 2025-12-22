'use client'

import { useEffect, useState } from 'react'

export function MobileNotificationOptIn() {
  const [status, setStatus] =
    useState<NotificationPermission>('default')

  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      setStatus(Notification.permission)
    }
  }, [])

  async function requestPermission() {
    if (!('Notification' in window)) return

    const permission =
      await Notification.requestPermission()
    setStatus(permission)
  }

  if (status === 'granted') {
    return (
      <div className="text-xs text-emerald-400">
        Mobile alerts enabled
      </div>
    )
  }

  if (status === 'denied') {
    return (
      <div className="text-xs text-red-400">
        Notifications blocked
      </div>
    )
  }

  return (
    <button
      onClick={requestPermission}
      className="
        px-3 py-1 rounded-md text-xs
        bg-white/10 hover:bg-white/20
      "
    >
      Enable Mobile Alerts
    </button>
  )
}
