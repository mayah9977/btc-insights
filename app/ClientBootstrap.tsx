'use client'

import { useEffect, useRef } from 'react'
import { Toaster } from 'react-hot-toast'
import { useAlertsSSEStore } from '@/lib/alerts/alertsSSEStore'
import { registerPushToken } from '@/lib/notification/registerPushToken'

export default function ClientBootstrap() {
  const bootstrapAlertsSSE = useAlertsSSEStore(s => s.bootstrap)
  const pushInitRef = useRef(false)

  useEffect(() => {
    bootstrapAlertsSSE()

    if (!pushInitRef.current) {
      pushInitRef.current = true
      registerPushToken().catch(() => {})
    }
  }, [bootstrapAlertsSSE])

  return <Toaster position="bottom-right" />
}
