'use client'

import dynamic from 'next/dynamic'
import { useMemo } from 'react'
import { getMarketSnapshot } from '@/lib/market/engine/marketSnapshot'

import VIPTopKPIBar from '@/components/vip/VIPTopKPIBar'
import VIPRiskEngineBannerMobile from './VIPRiskEngineBannerMobile'
import VIPLiveStatusStripMobile from './VIPLiveStatusStripMobile'
import VIPInstitutionalGuideCardMobile from './VIPInstitutionalGuideCardMobile'
import VIPActionGateContextBarMobile from './VIPActionGateContextBarMobile'

import { useVIPMarketStore } from '@/lib/market/store/vipMarketStore'
import { useVIPMarketStream } from '@/lib/realtime/useVIPMarketStream'

import { useRealtimeBollingerSignal } from '@/lib/realtime/useRealtimeBollingerSignal'
import { useLiveBollingerCommentary } from '@/lib/realtime/useLiveBollingerCommentary'

import { generateNarrative } from '@/lib/market/narrative/generateNarrative'
import { BOLLINGER_SENTENCE_MAP } from '@/lib/market/actionGate/bollingerSentenceMap'
import { BollingerSignalType } from '@/lib/market/actionGate/signalType'
import type { FinalNarrativeReport } from '@/lib/market/narrative/types'

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
     SSE (1곳만 유지)
  =============================== */
  useVIPMarketStream(symbol, { throttle: 1500 })

  const marketTick = useVIPMarketStore((s) => s.ts)

  /* ===============================
     준비 상태
  =============================== */
  const isReady = useVIPMarketStore((s) => {
    return (
      s.ts > 0 &&
      (s.oiDelta !== 0 ||
        s.volumeRatio !== 1 ||
        s.fundingRate !== 0 ||
        s.whaleNetRatio !== 0)
    )
  })

  /* ===============================
     Bollinger Hook (1곳만)
  =============================== */
  const confirmed = useRealtimeBollingerSignal()
  const live = useLiveBollingerCommentary()

  const signalType = useMemo(() => {
    if (
      confirmed?.signalType ===
      BollingerSignalType.INSIDE_LOWER_TOUCH_OR_BREAK
    ) {
      return confirmed.signalType
    }

    return confirmed?.signalType ?? live?.signalType
  }, [confirmed?.signalType, live?.signalType])

  /* ===============================
     Narrative 생성 (1곳만)
  =============================== */
  const sentence = useMemo<FinalNarrativeReport | null>(() => {
    if (!signalType || !isReady) return null

    return generateNarrative(
      BOLLINGER_SENTENCE_MAP[signalType],
      signalType
    )
  }, [signalType, isReady])

  /* ===============================
     Snapshot 기반 데이터
  =============================== */
  const mobileData = useMemo(() => {
    const snapshot = getMarketSnapshot()

    return {
      whaleRatio: Number((snapshot.whaleRatio ?? 0).toFixed(2)),
      whaleNet: Number((snapshot.whaleNetRatio ?? 0) * 100),
      whaleIntensity: Number(
        Math.min(
          Math.max(snapshot.whaleIntensity ?? 0, 0),
          100
        ).toFixed(1)
      ),
    }
  }, [marketTick])

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

  const confidence = Math.min(
    Math.abs(mobileData.whaleNet),
    100
  )

  /* ===============================
     Render
  =============================== */
  return (
    <main className="space-y-6 pb-20">

       <VIPTopKPIBar avoidedExtremeCount={0} />

      <VIPRiskEngineBannerMobile />

      <VIPActionGateContextBarMobile
        symbol={symbol}
        signalType={signalType}
        sentence={sentence}
      />

      <VIPLiveStatusStripMobile symbol={symbol} />

      <VIPWhaleMiniCharts />

      <VIPWhaleTradeGuideCardMobile
        ratio={mobileData.whaleRatio}
        net={mobileData.whaleNet}
      />

      <VIPInstitutionalGuideCardMobile
        long={long}
        short={short}
        confidence={confidence}
        dominant={dominant}
        intensity={mobileData.whaleIntensity}
      />

      <VIPOverviewDashboardMobile />
    </main>
  )
}
