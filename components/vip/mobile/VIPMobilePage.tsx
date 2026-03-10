'use client'

import dynamic from 'next/dynamic'

import VIPTopKPIBar from '@/components/vip/VIPTopKPIBar'

import VIPLiveStatusStripMobile from './VIPLiveStatusStripMobile'
import VIPInstitutionalGuideCardMobile from './VIPInstitutionalGuideCardMobile'

import { useVIPMarketStore } from '@/lib/market/store/vipMarketStore'
import { useVIPMarketStream } from '@/lib/realtime/useVIPMarketStream'

/* ===============================
   Mobile dynamic components
=============================== */

const VIPWhaleMiniCharts = dynamic(
  () => import('./VIPWhaleMiniCharts'),
  { ssr: false }
)

const VIPWhaleTradeGuideCardMobile = dynamic(
  () => import('./VIPWhaleTradeGuideCardMobile'),
  { ssr: false }
)

const VIPOverviewDashboardMobile = dynamic(
  () => import('./VIPOverviewDashboardMobile'),
  { ssr: false }
)

type Props = {
  userId: string
  weeklySummary: any
  monthlySummary: any
  vip3Metrics: any
}

export default function VIPMobilePage(props: Props) {

  const symbol = 'BTCUSDT'

  /* ===============================
     Mobile optimized SSE
  =============================== */

  useVIPMarketStream(symbol, { throttle: 4000 })

  /* ===============================
     Zustand selectors
  =============================== */

  const whaleRatio = useVIPMarketStore((s) => s.whaleRatio)
  const whaleNet = useVIPMarketStore((s) => s.whaleNet)
  const whaleIntensity = useVIPMarketStore((s) => s.whaleIntensity)

  /* ===============================
     Derived values
  =============================== */

  const long = Math.max(0, whaleNet * 100)
  const short = Math.max(0, -whaleNet * 100)

  const dominant =
    whaleNet > 0.05
      ? 'LONG'
      : whaleNet < -0.05
      ? 'SHORT'
      : 'NONE'

  const confidence =
    Math.min(Math.abs(whaleNet) * 100, 100)

  /* ===============================
     Render
  =============================== */

  return (
    <main className="space-y-6 pb-20">

      {/* KPI */}
      <VIPTopKPIBar avoidedExtremeCount={0} />

      {/* Live market strip */}
      <VIPLiveStatusStripMobile symbol={symbol} />

      {/* Whale charts */}
      <VIPWhaleMiniCharts />

      {/* Whale trade guide */}
      <VIPWhaleTradeGuideCardMobile
        ratio={whaleRatio}
        net={whaleNet}
      />

      {/* Institutional flow */}
      <VIPInstitutionalGuideCardMobile
        long={long}
        short={short}
        confidence={confidence}
        dominant={dominant}
        intensity={whaleIntensity}
      />

      {/* Market Context */}
      <VIPOverviewDashboardMobile />

    </main>
  )

}
