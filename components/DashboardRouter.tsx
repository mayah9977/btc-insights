'use client'

import { useEffect, useState } from 'react'

import MobileDashboard from './mobile/MobileDashboard'

import { ActionGateStatus } from '@/components/system/ActionGateStatus'
import { RawObservationBar } from '@/components/market/observation/RawObservationBar'

import VIPWhaleIntensityChart from '@/components/vip/VIPWhaleIntensityChart'
import VIPWhaleTradeFlowChart from '@/components/vip/VIPWhaleTradeFlowChart'

function DesktopDashboard() {
  return (
    <div className="grid grid-cols-2 gap-6">

      <ActionGateStatus />

      <RawObservationBar symbol="BTCUSDT" />

      <VIPWhaleIntensityChart />

      <VIPWhaleTradeFlowChart />

    </div>
  )
}

export default function DashboardRouter() {
  const [mobile, setMobile] = useState(false)

  useEffect(() => {
    setMobile(window.innerWidth < 768)
  }, [])

  if (mobile) {
    return <MobileDashboard />
  }

  return <DesktopDashboard />
}
