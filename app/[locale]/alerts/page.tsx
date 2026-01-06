'use client'

import { useEffect } from 'react'
import { useAlertsSSEStore } from '@/lib/alerts/alertsSSEStore'
import { useAlertsStore } from './providers/alertsStore.zustand'
import BTCAlertsView from './btc/BTCAlertsView'

export default function AlertsPage() {
  const bootstrapSSE = useAlertsSSEStore(s => s.bootstrap)
  const bootstrapData = useAlertsStore(s => s.bootstrap)

  useEffect(() => {
    bootstrapSSE()   // 🔌 SSE (단 1회)
    bootstrapData()  // 📦 alerts 데이터
  }, [bootstrapSSE, bootstrapData])

  return <BTCAlertsView />
}
