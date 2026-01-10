'use client'

import { useEffect, useState } from 'react'
import clsx from 'clsx'

import AlertStatsCard from '../AlertStatsCard'
import ActiveAlertsList from '../components/ActiveAlertsList'
import AlertsToast, { emitToast } from '../components/AlertsToast'
import AlertCreateModal from '../components/AlertCreateModal'
import AlertEditModal from '../components/AlertEditModal'

import BTCPricePresets from './BTCPricePresets'
import CriticalPriceOverlay from './CriticalPriceOverlay'
import VIPWhaleZoneOverlay from './VIPWhaleZoneOverlay'
import VIPWhaleHeatmap from './VIPWhaleHeatmap'
import CriticalChecklistOverlay from './CriticalChecklistOverlay'

import { useCriticalLock } from './useCriticalLock'
import { useCriticalChecklist } from './useCriticalChecklist'
import { useAlertsStore } from '../providers/alertsStore.zustand'
import { useAlertsSSEStore } from '@/lib/alerts/alertsSSEStore'
import { useRealtimeMarket } from '@/lib/realtime/useRealtimeMarket'
import type { PriceAlert } from '@/lib/alerts/alertStore.types'

export default function BTCAlertsView() {
  // ✅ SSE 단일 bootstrap
  const bootstrapSSE = useAlertsSSEStore(s => s.bootstrap)
  useEffect(() => {
    bootstrapSSE()
  }, [bootstrapSSE])

  const market = useRealtimeMarket()
  const { locked, unlock } = useCriticalLock(market.price)
  const critical = useCriticalChecklist(market.price)

  const { bootstrap } = useAlertsStore()

  const [createOpen, setCreateOpen] = useState(false)
  const [editAlert, setEditAlert] = useState<PriceAlert | null>(null)

  useEffect(() => {
    document.body.style.background = '#05070d'
    return () => {
      document.body.style.background = ''
    }
  }, [])

  return (
    <div className="relative min-h-screen bg-[#05070d] text-white overflow-hidden">
      {critical.locked && (
        <CriticalChecklistOverlay
          checks={critical.checks}
          toggle={critical.toggle}
          unlock={critical.unlock}
        />
      )}

      {locked && !critical.locked && (
        <CriticalPriceOverlay price={market.price} onConfirm={unlock} />
      )}

      <VIPWhaleZoneOverlay price={market.price} />

      <div className="relative z-10 mx-auto mt-6 w-full max-w-[420px] px-4">
        <VIPWhaleHeatmap price={market.price} />
      </div>

      <AlertsToast />

      <div className="relative z-10 flex justify-center pt-10">
        <AlertStatsCard />
      </div>

      <div className="relative z-10 mx-auto mt-10 w-full max-w-[420px] px-4">
        <h2 className="mb-4 text-sm font-extrabold tracking-widest text-yellow-400">
          BTC PRICE ALERTS
        </h2>

        <BTCPricePresets disabled={!critical.canTrade} />

        <div className="mt-6 rounded-3xl p-4 bg-gradient-to-b from-[#0c1224] to-[#070b17] border border-white/10">
          <ActiveAlertsList onEdit={setEditAlert} />
        </div>
      </div>

      {createOpen && (
        <AlertCreateModal
          onClose={() => setCreateOpen(false)}
          onSaved={() => {
            bootstrap()
            setCreateOpen(false)
          }}
        />
      )}

      {editAlert && (
        <AlertEditModal
          alert={editAlert}
          onClose={() => setEditAlert(null)}
          onSaved={() => {
            bootstrap()
            setEditAlert(null)
          }}
        />
      )}
    </div>
  )
}
