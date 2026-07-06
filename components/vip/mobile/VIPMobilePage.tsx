// components/vip/mobile/VIPMobilePage.tsx

'use client'

import dynamic from 'next/dynamic'
import {
  memo,
  useMemo,
} from 'react'
import { getMarketSnapshot } from '@/lib/market/engine/marketSnapshot'

import VIPTopKPIBar from '@/components/vip/VIPTopKPIBar'
import VIPRiskEngineBannerMobile from './VIPRiskEngineBannerMobile'
import VIPLiveStatusStripMobile from './VIPLiveStatusStripMobile'
import VIPInstitutionalGuideCardMobile from './VIPInstitutionalGuideCardMobile'

import { useVIPMarketStore } from '@/lib/market/store/vipMarketStore'
import { useFinalizedSnapshotBootstrap } from '@/lib/market/institutional/useFinalizedSnapshotBootstrap'
import { useFinalizedInstitutionalSnapshot } from '@/lib/market/institutional/useFinalizedInstitutionalSnapshot'

import { useRealtimeBollingerSignal } from '@/lib/realtime/useRealtimeBollingerSignal'
import { useLiveBollingerCommentary } from '@/lib/realtime/useLiveBollingerCommentary'

import { generateNarrative } from '@/lib/market/narrative/generateNarrative'
import { BOLLINGER_SENTENCE_MAP } from '@/lib/market/actionGate/bollingerSentenceMap'
import { BollingerSignalType } from '@/lib/market/actionGate/signalType'
import type { FinalNarrativeReport } from '@/lib/market/narrative/types'

const VIPActionGateContextBarMobileInner = dynamic(
  () => import('./VIPActionGateContextBarMobile'),
  { ssr: false },
)

const VIPActionGateContextBarMobileMemo = memo(
  VIPActionGateContextBarMobileInner,
)

const VIPWhaleMiniCharts = dynamic(
  () => import('./VIPWhaleMiniCharts'),
  { ssr: false },
)

const VIPWhaleTradeGuideCardMobile = dynamic(
  () => import('./VIPWhaleTradeGuideCardMobile'),
  { ssr: false },
)

const VIPOverviewDashboardMobileInner = dynamic(
  () => import('./VIPOverviewDashboardMobile'),
  { ssr: false },
)

const VIPOverviewDashboardMobileMemo = memo(
  VIPOverviewDashboardMobileInner,
)

function isBollingerSignalType(
  value: unknown,
): value is BollingerSignalType {
  return (
    typeof value === 'string' &&
    value in BOLLINGER_SENTENCE_MAP
  )
}

function VIPWhaleSection() {
  const marketTick = useVIPMarketStore((s) => s.ts)

  const mobileData = useMemo(() => {
    const snapshot = getMarketSnapshot()

    return {
      whaleRatio: Number((snapshot.whaleRatio ?? 0).toFixed(2)),
      whaleNet: Number((snapshot.whaleNetRatio ?? 0) * 100),
      whaleIntensity: Number(
        Math.min(
          Math.max(snapshot.whaleIntensity ?? 0, 0),
          100,
        ).toFixed(1),
      ),
    }
  }, [marketTick])

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
    100,
  )

  return (
    <>
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
    </>
  )
}

const VIPWhaleSectionMemo = memo(VIPWhaleSection)

type Props = {
  userId: string
  weeklySummary: any
  monthlySummary: any
  vip3Metrics: any
}

export default function VIPMobilePage(props: Props) {
  const symbol = 'BTCUSDT'

  useFinalizedSnapshotBootstrap()

  const finalized =
    useFinalizedInstitutionalSnapshot()

  /*
   * SSE는 app/[locale]/casino/vip/vipClientPage.tsx에서만 실행합니다.
   * VIPMobilePage는 VIP market store를 read-only로 사용합니다.
   */

  const isReady = useVIPMarketStore((s) => {
    return (
      s.ts > 0 &&
      (s.oiDelta !== 0 ||
        s.volumeRatio !== 1 ||
        s.fundingRate !== 0 ||
        s.whaleNetRatio !== 0)
    )
  })

  const confirmed = useRealtimeBollingerSignal()
  const live = useLiveBollingerCommentary()

  const signalType = useMemo<BollingerSignalType>(() => {
    if (
      confirmed?.signalType ===
      BollingerSignalType.INSIDE_LOWER_TOUCH_OR_BREAK
    ) {
      return confirmed.signalType
    }

    if (confirmed?.signalType) {
      return confirmed.signalType
    }

    if (live?.signalType) {
      return live.signalType
    }

    if (
      isBollingerSignalType(
        finalized.confirmedSignalType,
      )
    ) {
      return finalized.confirmedSignalType
    }

    return BollingerSignalType.INSIDE_CENTER
  }, [
    confirmed?.signalType,
    live?.signalType,
    finalized.confirmedSignalType,
  ])

  const isNarrativeReady =
    isReady || finalized.snapshotReady

  const sentence = useMemo<FinalNarrativeReport | null>(() => {
    if (!signalType || !isNarrativeReady) return null

    return generateNarrative(
      BOLLINGER_SENTENCE_MAP[signalType],
      signalType,
    )
  }, [signalType, isNarrativeReady])

  return (
    <main className="space-y-6 pb-20">
      <VIPTopKPIBar avoidedExtremeCount={0} />

      <VIPRiskEngineBannerMobile />

      <VIPActionGateContextBarMobileMemo
        symbol={symbol}
        signalType={signalType}
        sentence={sentence}
      />

      <VIPLiveStatusStripMobile symbol={symbol} />

      <VIPWhaleSectionMemo />

      <VIPOverviewDashboardMobileMemo />
    </main>
  )
}
