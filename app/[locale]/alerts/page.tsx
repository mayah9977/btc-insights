// /app/[locale]/alerts/page.tsx
'use client'

import { useEffect } from 'react'
import { useAlertsSSEStore } from '@/lib/alerts/alertsSSEStore'
import { useAlertsStore } from './providers/alertsStore.zustand'

import BTCAlertsView from './btc/BTCAlertsView'

export default function AlertsPage() {
  const bootstrapSSE = useAlertsSSEStore(s => s.bootstrap)
  const bootstrapData = useAlertsStore(s => s.bootstrap)

  useEffect(() => {
    bootstrapSSE()
    bootstrapData()
  }, [bootstrapSSE, bootstrapData])

  return (
    <div className="space-y-6">
      <BTCAlertsView />
    </div>
  )
}
