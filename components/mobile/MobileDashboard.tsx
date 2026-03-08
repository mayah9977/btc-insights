'use client'

import React from 'react'

import ActionGateStatus from './ActionGateStatus.mobile'
import RawObservationBar from './RawObservationBar.mobile'

import dynamic from 'next/dynamic'

const VIPWhaleIntensityChart = dynamic(
  () => import('./VIPWhaleIntensityChart.mobile'),
  { ssr: false }
)

const VIPWhaleTradeFlowChart = dynamic(
  () => import('./VIPWhaleTradeFlowChart.mobile'),
  { ssr: false }
)

export default function MobileDashboard() {
  return (
    <div className="flex flex-col gap-4">

      <ActionGateStatus />

      <RawObservationBar symbol="BTCUSDT" />

      <VIPWhaleIntensityChart />

      <VIPWhaleTradeFlowChart />

    </div>
  )
}
