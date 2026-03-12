import VIPKpiBoundary from '@/components/vip/boundary/VIPKpiBoundary'
import VIPLiveStatusStripBoundary from '@/components/vip/boundary/VIPLiveStatusStripBoundary'
import VIPWhaleWarningBoundary from '@/components/vip/boundary/VIPWhaleWarningBoundary'
import VIPWhaleIntensityChartBoundary from '@/components/vip/boundary/VIPWhaleIntensityChartBoundary'
import VIPWhaleTradeFlowChartBoundary from '@/components/vip/boundary/VIPWhaleTradeFlowChartBoundary'
import VIPMetricsBoundary from '@/components/vip/boundary/VIPMetricsBoundary'

import VIPCompareTable from '@/components/vip/VIPCompareTable'
import { VIPOverviewDashboard } from '@/components/vip/VIPOverviewDashboard'

import { VIPActionGateContextBar } from '@/components/vip/VIPActionGateContextBar'
import { RawObservationBar } from '@/components/market/observation/RawObservationBar'

type Props = {
  userId: string
  weeklySummary: any
  monthlySummary: any
  vip3Metrics: any
}

export default function VIPDesktopPage({
  userId,
  weeklySummary,
  monthlySummary,
  vip3Metrics,
}: Props) {

  return (
    <>
      <VIPKpiBoundary />

      <VIPActionGateContextBar symbol="BTCUSDT" />

      <RawObservationBar symbol="BTCUSDT" />

      <VIPLiveStatusStripBoundary />

      <VIPWhaleWarningBoundary />

      <main className="space-y-10">

        <VIPWhaleIntensityChartBoundary />

        <VIPWhaleTradeFlowChartBoundary />

        <VIPMetricsBoundary vip3Metrics={vip3Metrics} />

        <VIPCompareTable />

        <VIPOverviewDashboard />

      </main>
    </>
  )
}
