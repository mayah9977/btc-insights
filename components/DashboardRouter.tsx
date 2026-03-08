'use client'

import { useEffect, useState } from 'react'

import MobileDashboard from './mobile/MobileDashboard'

import { ActionGateStatus } from '@/components/system/ActionGateStatus'
import { RawObservationBar } from '@/components/market/observation/RawObservationBar'

import VIPWhaleIntensityChart from '@/components/vip/VIPWhaleIntensityChart'
import VIPWhaleTradeFlowChart from '@/components/vip/VIPWhaleTradeFlowChart'

function DesktopDashboard() {
  const symbol = 'BTCUSDT'

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">

      <div className="space-y-4 mb-6">
        <ActionGateStatus />
        <RawObservationBar symbol={symbol} />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <VIPWhaleIntensityChart symbol={symbol} />
        <VIPWhaleTradeFlowChart symbol={symbol} />
      </div>

    </div>
  )
}

export default function DashboardRouter() {

  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setIsMobile(window.innerWidth < 768)
  }, [])

  if (isMobile) return <MobileDashboard />

  return <DesktopDashboard />
}
