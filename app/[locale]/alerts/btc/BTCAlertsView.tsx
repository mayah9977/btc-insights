// /app/[locale]/alerts/btc/BTCAlertsView.tsx
'use client'

import { useEffect, useState } from 'react'
import clsx from 'clsx'

import AlertStatsCard from '../AlertStatsCard'
import ActiveAlertsList from '../components/ActiveAlertsList'
import AlertsToast from '../components/AlertsToast'
import AlertCreateModal from '../components/AlertCreateModal'
import AlertEditModal from '../components/AlertEditModal'

import IndicatorCards from './IndicatorCards'
import IndicatorInfoCards from './IndicatorInfoCards'
import CriticalPriceOverlay from './CriticalPriceOverlay'
import VIPWhaleZoneOverlay from './VIPWhaleZoneOverlay'
import VIPWhaleHeatmap from './VIPWhaleHeatmap'
import CriticalChecklistOverlay from './CriticalChecklistOverlay'

import HeroMobile from '@/components/casino/hero/HeroMobile'

import { useCriticalLock } from './useCriticalLock'
import { useCriticalChecklist } from './useCriticalChecklist'
import { useAlertsStore } from '../providers/alertsStore.zustand'
import { useAlertsSSEStore } from '@/lib/alerts/alertsSSEStore'
import { useRealtimeMarket } from '@/lib/realtime/useRealtimeMarket'
import type { PriceAlert } from '@/lib/alerts/alertStore.types'

export default function BTCAlertsView() {
  const bootstrapSSE = useAlertsSSEStore(s => s.bootstrap)

  useEffect(() => {
    bootstrapSSE()
  }, [bootstrapSSE])

  const market = useRealtimeMarket()
  const { locked, unlock } = useCriticalLock(market.price)
  const critical = useCriticalChecklist(market.price)

  const { bootstrap } = useAlertsStore()
  // const indicatorSignals = useAlertsStore(s => s.indicatorSignals) // ✅ 제거됨

  const [createOpen, setCreateOpen] = useState(false)
  const [editAlert, setEditAlert] = useState<PriceAlert | null>(null)

  useEffect(() => {
    document.body.style.background = '#05070d'
    return () => {
      document.body.style.background = ''
    }
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05070d] text-white">
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

      <div className="relative z-10 mx-auto mt-6 w-full max-w-[420px] px-4 sm:max-w-5xl">
        <VIPWhaleHeatmap price={market.price} />
      </div>

      <AlertsToast />

      <div className="relative z-10 flex justify-center pt-10">
        <AlertStatsCard />
      </div>

      <div className="relative z-10 mx-auto mt-10 w-full max-w-[420px] px-4 sm:max-w-5xl">
        <h2 className="mb-4 text-sm font-extrabold tracking-widest text-yellow-400">
          BTC Indecator Alert --- 보조지표 알람설정 (ON 활성화모드 / OFF 비활성화모드)
        </h2>

        <IndicatorCards />

        <div className="mt-6 rounded-3xl border border-white/10 bg-gradient-to-b from-[#0c1224] to-[#070b17] p-4">
          <ActiveAlertsList onEdit={setEditAlert} />
        </div>
      </div>

      <div className="relative z-10 mx-auto mt-10 w-full max-w-[420px] px-4 sm:max-w-5xl">
        <h2 className="mb-4 text-sm font-extrabold tracking-widest text-cyan-300">
          RSI + MACD + 이동평균선 설명 카드
        </h2>

        <IndicatorInfoCards />
      </div>

      {/* ✅ indicatorSignals 영역 제거 → HeroMobile로 교체 */}
      <div className="relative z-10 mx-auto mt-10 w-full max-w-[420px] px-4 sm:max-w-5xl">
        <HeroMobile
          isLoggedIn={true}
          isVIP={false}
          /* ✅ 여기서만 텍스트 override (핵심 변경) */
          title="기관급 고래들의 움직임 감지됨"
          description="실시간 고래들의 매수/매도 확인하러가기."
        />
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
