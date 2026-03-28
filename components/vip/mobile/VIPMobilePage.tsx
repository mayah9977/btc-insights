'use client'

import dynamic from 'next/dynamic'
import { useMemo } from 'react'
import { getMarketSnapshot } from '@/lib/market/engine/marketSnapshot'

import VIPTopKPIBar from '@/components/vip/VIPTopKPIBar'
import VIPRiskEngineBannerMobile from './VIPRiskEngineBannerMobile'
import VIPLiveStatusStripMobile from './VIPLiveStatusStripMobile'
import VIPInstitutionalGuideCardMobile from './VIPInstitutionalGuideCardMobile'
import MobileBollingerContext from './MobileBollingerContext'

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
     (속도 개선: 4000 → 1500)
  =============================== */

  useVIPMarketStream(symbol, { throttle: 1500 })

  /* ===============================
     Snapshot 기반 데이터
  =============================== */

  const snapshot = getMarketSnapshot()

  const mobileData = useMemo(() => {
    const safeVolume = Math.max(snapshot.volume ?? 1, 1)

    return {
      whaleRatio: Number((snapshot.whaleRatio ?? 0).toFixed(2)),
      whaleNet: Number((snapshot.whaleNetRatio ?? 0) * 100),
      whaleIntensity: Number(
        Math.min(Math.max(snapshot.whaleIntensity ?? 0, 0), 100).toFixed(1)
      ),
    }
  }, [snapshot.ts])

  /* ===============================
     Derived values
  =============================== */

  const long = Math.max(0, mobileData.whaleNet)
  const short = Math.max(0, -mobileData.whaleNet)

  const dominant =
    mobileData.whaleNet > 5
      ? 'LONG'
      : mobileData.whaleNet < -5
      ? 'SHORT'
      : 'NONE'

  const confidence =
    Math.min(Math.abs(mobileData.whaleNet), 100)

  /* ===============================
     Render
  =============================== */

  return (
    <main className="space-y-6 pb-20">

      {/* KPI */}
      <VIPTopKPIBar avoidedExtremeCount={0} />

      {/* RiskEngineBanner */}
      <VIPRiskEngineBannerMobile />

      {/* Bollinger Context */}
      <MobileBollingerContext />

      {/* Live market strip */}
      <VIPLiveStatusStripMobile symbol={symbol} />

      {/* Whale charts */}
      <VIPWhaleMiniCharts />

      {/* Whale trade guide */}
      <VIPWhaleTradeGuideCardMobile
        ratio={mobileData.whaleRatio}
        net={mobileData.whaleNet}
      />

      {/* Institutional flow */}
      <VIPInstitutionalGuideCardMobile
        long={Math.max(0, mobileData.whaleNet)}
        short={Math.max(0, -mobileData.whaleNet)}
        confidence={Math.min(Math.abs(mobileData.whaleNet), 100)}
        dominant={
          mobileData.whaleNet > 5
            ? 'LONG'
            : mobileData.whaleNet < -5
            ? 'SHORT'
            : 'NONE'
        }
        intensity={mobileData.whaleIntensity}
      />

      {/* Market Context */}
      <VIPOverviewDashboardMobile />

    </main>
  )
}
