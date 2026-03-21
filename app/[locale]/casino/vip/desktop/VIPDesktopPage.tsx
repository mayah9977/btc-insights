import dynamic from 'next/dynamic'

import VIPKpiBoundary from '@/components/vip/boundary/VIPKpiBoundary'
import VIPLiveStatusStripBoundary from '@/components/vip/boundary/VIPLiveStatusStripBoundary'
import VIPWhaleWarningBoundary from '@/components/vip/boundary/VIPWhaleWarningBoundary'

import { VIPActionGateContextBar } from '@/components/vip/VIPActionGateContextBar'
import { RawObservationBar } from '@/components/market/observation/RawObservationBar'

/* =========================================================
   Lazy Loaded Components (Heavy)
========================================================= */

const VIPWhaleIntensityChartBoundary = dynamic(
  () => import('@/components/vip/boundary/VIPWhaleIntensityChartBoundary'),
  {
    ssr: false,
    loading: () => <div className="h-[320px]" />,
  }
)

const VIPWhaleTradeFlowChartBoundary = dynamic(
  () => import('@/components/vip/boundary/VIPWhaleTradeFlowChartBoundary'),
  {
    ssr: false,
    loading: () => <div className="h-[320px]" />,
  }
)

const VIPMetricsBoundary = dynamic(
  () => import('@/components/vip/boundary/VIPMetricsBoundary'),
  {
    ssr: false,
    loading: () => <div className="h-[200px]" />,
  }
)

const VIPCompareTable = dynamic(
  () => import('@/components/vip/VIPCompareTable'),
  {
    ssr: false,
    loading: () => <div className="h-[200px]" />,
  }
)

const VIPOverviewDashboard = dynamic(
  () =>
    import('@/components/vip/VIPOverviewDashboard').then(
      (mod) => mod.VIPOverviewDashboard
    ),
  {
    ssr: false,
    loading: () => <div className="h-[200px]" />,
  }
)

/* =========================================================
   Props
========================================================= */

type Props = {
  userId: string
  weeklySummary: any
  monthlySummary: any
  vip3Metrics: any
}

/* =========================================================
   VIP Desktop Page
========================================================= */

export default function VIPDesktopPage({
  userId,
  weeklySummary,
  monthlySummary,
  vip3Metrics,
}: Props) {
  return (
    <>
      {/* =========================
          Realtime Header
      ========================= */}

      <VIPKpiBoundary />

      <VIPActionGateContextBar symbol="BTCUSDT" />

      <RawObservationBar symbol="BTCUSDT" />

      <VIPLiveStatusStripBoundary />

      <VIPWhaleWarningBoundary />

      {/* =========================
          Main Content
      ========================= */}

      <main className="space-y-10">

        {/* =========================
            Charts (Lazy)
        ========================= */}

        <section className="space-y-10">
          <VIPWhaleIntensityChartBoundary />
          <VIPWhaleTradeFlowChartBoundary />
        </section>

        {/* =========================
            Analysis
        ========================= */}

        <section className="space-y-10">
          <VIPMetricsBoundary vip3Metrics={vip3Metrics} />
          <VIPCompareTable />
          <VIPOverviewDashboard />
        </section>

      </main>
    </>
  )
}
