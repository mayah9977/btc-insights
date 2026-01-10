'use client'

import { useEffect } from 'react'
import { useAlertsSSEStore } from '@/lib/alerts/alertsSSEStore'
import { useAlertsStore } from './providers/alertsStore.zustand'

import CreateAlertButton from './components/CreateAlertButton'
import BTCAlertsView from './btc/BTCAlertsView'

export default function AlertsPage() {
  const bootstrapSSE = useAlertsSSEStore(s => s.bootstrap)
  const bootstrapData = useAlertsStore(s => s.bootstrap)

  useEffect(() => {
    bootstrapSSE()   // 🔌 SSE (단 1회)
    bootstrapData()  // 📦 alerts 초기 로드
  }, [bootstrapSSE, bootstrapData])

  return (
    <div className="space-y-6">
      {/* ➕ 새 알림 생성 버튼 */}
      <CreateAlertButton />

      {/* 기존 Alerts UI */}
      <BTCAlertsView />
    </div>
  )
}
