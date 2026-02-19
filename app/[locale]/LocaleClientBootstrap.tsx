'use client'

import { useEffect } from 'react'
import { useAlertsSSEStore } from '@/lib/alerts/alertsSSEStore'

export default function LocaleClientBootstrap() {
  const bootstrapAlertsSSE = useAlertsSSEStore(s => s.bootstrap)

  useEffect(() => {
    bootstrapAlertsSSE()
  }, [bootstrapAlertsSSE])

  return null
}
