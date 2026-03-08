'use client'

import ActionGateStatusMobile from './ActionGateStatus.mobile'
import RawObservationBarMobile from './RawObservationBar.mobile'
import VIPWhaleIntensityChartMobile from './VIPWhaleIntensityChart.mobile'
import VIPWhaleTradeFlowChartMobile from './VIPWhaleTradeFlowChart.mobile'

import { useVIPMarketStream } from '@/lib/realtime/useVIPMarketStream'

export default function MobileDashboard() {

  const symbol = 'BTCUSDT'

  useVIPMarketStream(symbol)

  return (
    <div className="flex flex-col gap-4 p-3">

      <ActionGateStatusMobile />

      <RawObservationBarMobile />

      <VIPWhaleIntensityChartMobile />

      <VIPWhaleTradeFlowChartMobile />

    </div>
  )
}
