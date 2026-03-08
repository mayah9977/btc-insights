'use client'

import React from 'react'

import { useVIPMarketStream } from '@/lib/realtime/useVIPMarketStream'

import ActionGateStatus from './ActionGateStatus.mobile'
import RawObservationBar from './RawObservationBar.mobile'

import dynamic from 'next/dynamic'

/* =========================================
   Lazy Charts (Mobile)
========================================= */

const VIPWhaleIntensityChart = dynamic(
  () => import('./VIPWhaleIntensityChart.mobile'),
  { ssr: false }
)

const VIPWhaleTradeFlowChart = dynamic(
  () => import('./VIPWhaleTradeFlowChart.mobile'),
  { ssr: false }
)

/* =========================================
   Mobile Dashboard
========================================= */

export default function MobileDashboard() {

  const symbol = 'BTCUSDT'

  /* =========================================
     🔥 Start realtime stream (VERY IMPORTANT)
     SSE → store → charts pipeline
  ========================================= */

  useVIPMarketStream(symbol)

  return (
    <div className="flex flex-col gap-4">

      {/* AI Gate */}
      <ActionGateStatus />

      {/* Market Observation */}
      <RawObservationBar symbol={symbol} />

      {/* Whale Intensity Chart */}
      <VIPWhaleIntensityChart />

      {/* Whale Trade Flow Chart */}
      <VIPWhaleTradeFlowChart />

    </div>
  )
}
