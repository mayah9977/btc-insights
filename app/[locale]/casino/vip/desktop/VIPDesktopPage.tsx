'use client'

import dynamic from 'next/dynamic'
import { useMemo } from 'react'

import VIPKpiBoundary from '@/components/vip/boundary/VIPKpiBoundary'
import VIPLiveStatusStripBoundary from '@/components/vip/boundary/VIPLiveStatusStripBoundary'
import VIPWhaleWarningBoundary from '@/components/vip/boundary/VIPWhaleWarningBoundary'

import VIPActionGateContextBar from '@/components/vip/VIPActionGateContextBar'
import { RawObservationBar } from '@/components/market/observation/RawObservationBar'

import { useRealtimeBollingerSignal } from '@/lib/realtime/useRealtimeBollingerSignal'
import { useLiveBollingerCommentary } from '@/lib/realtime/useLiveBollingerCommentary'
import { BollingerSignalType } from '@/lib/market/actionGate/signalType'
import { BOLLINGER_SENTENCE_MAP } from '@/lib/market/actionGate/bollingerSentenceMap'
import { generateNarrative } from '@/lib/market/narrative/generateNarrative'

const VIPWhaleIntensityChartBoundary = dynamic(
  () => import('@/components/vip/boundary/VIPWhaleIntensityChartBoundary'),
  { ssr: false, loading: () => <div className="h-[320px]" /> }
)

const VIPWhaleTradeFlowChartBoundary = dynamic(
  () => import('@/components/vip/boundary/VIPWhaleTradeFlowChartBoundary'),
  { ssr: false, loading: () => <div className="h-[320px]" /> }
)

const VIPMetricsBoundary = dynamic(
  () => import('@/components/vip/boundary/VIPMetricsBoundary'),
  { ssr: false, loading: () => <div className="h-[200px]" /> }
)

const VIPCompareTable = dynamic(
  () => import('@/components/vip/VIPCompareTable'),
  { ssr: false, loading: () => <div className="h-[200px]" /> }
)

/* ✅ FIX: named export 대응 */
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
  const confirmed = useRealtimeBollingerSignal()
  const live = useLiveBollingerCommentary()

  const signalType = useMemo(() => {
    if (
      confirmed?.signalType ===
      BollingerSignalType.INSIDE_LOWER_TOUCH_OR_BREAK
    ) {
      return confirmed?.signalType
    }
    return confirmed?.signalType ?? live?.signalType
  }, [confirmed?.signalType, live?.signalType])

  const sentence = useMemo(() => {
    if (!signalType) return null
    return generateNarrative(
      BOLLINGER_SENTENCE_MAP[signalType],
      signalType
    )
  }, [signalType])

  return (
    <>
      <VIPKpiBoundary />

      <VIPActionGateContextBar
        symbol="BTCUSDT"
        signalType={signalType}
        sentence={sentence}
      />

      <RawObservationBar symbol="BTCUSDT" />

      <VIPLiveStatusStripBoundary />
      <VIPWhaleWarningBoundary />

      <main className="space-y-10">
        <section className="space-y-10">
          <VIPWhaleIntensityChartBoundary />
          <VIPWhaleTradeFlowChartBoundary />
        </section>

        <section className="space-y-10">
          <VIPMetricsBoundary vip3Metrics={vip3Metrics} />
          <VIPCompareTable />
          <VIPOverviewDashboard />
        </section>
      </main>
    </>
  )
}
