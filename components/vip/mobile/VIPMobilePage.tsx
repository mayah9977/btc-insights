'use client'

import VIPTopKPIBar from '@/components/vip/VIPTopKPIBar'
import { VIPActionGateContextBar } from '@/components/vip/VIPActionGateContextBar'

import VIPLiveStatusStripMobile from './VIPLiveStatusStripMobile'
import RawObservationBarMobile from './RawObservationBarMobile'

import VIPWhaleIntensityMiniChart from './VIPWhaleIntensityMiniChart'
import VIPWhaleFlowMiniChart from './VIPWhaleFlowMiniChart'

import { useVIPMarketStream } from '@/lib/realtime/useVIPMarketStream'

/* =========================
   Props Type (Error Fix)
========================= */

type Props = {
  userId: string
  weeklySummary: any
  monthlySummary: any
  vip3Metrics: any
}

export default function VIPMobilePage({
  userId,
  weeklySummary,
  monthlySummary,
  vip3Metrics,
}: Props) {

  const symbol = 'BTCUSDT'

  /* =========================
     SSE Stream
  ========================= */

  useVIPMarketStream(symbol)

  return (

    <main className="space-y-6 pb-20">

      <VIPTopKPIBar avoidedExtremeCount={0} />

      <VIPActionGateContextBar symbol={symbol} />

      <VIPLiveStatusStripMobile symbol={symbol} />

      <RawObservationBarMobile symbol={symbol} />

      <VIPWhaleIntensityMiniChart />

      <VIPWhaleFlowMiniChart />

    </main>

  )
}
