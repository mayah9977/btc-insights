'use client'

import VIPTopKPIBar from '@/components/vip/VIPTopKPIBar'
import { VIPActionGateContextBar } from '@/components/vip/VIPActionGateContextBar'

import VIPLiveStatusStripMobile from './VIPLiveStatusStripMobile'
import RawObservationBarMobile from './RawObservationBarMobile'

import VIPWhaleIntensityMiniChart from './VIPWhaleIntensityMiniChart'
import VIPWhaleFlowMiniChart from './VIPWhaleFlowMiniChart'

import VIPWhaleTradeGuideCardMobile from './VIPWhaleTradeGuideCardMobile'
import VIPInstitutionalGuideCardMobile from './VIPInstitutionalGuideCardMobile'
import VIPOverviewDashboardMobile from './VIPOverviewDashboardMobile'

import { useVIPMarketStore } from '@/lib/market/store/vipMarketStore'
import { useVIPMarketStream } from '@/lib/realtime/useVIPMarketStream'

type Props = {
  userId:string
  weeklySummary:any
  monthlySummary:any
  vip3Metrics:any
}

export default function VIPMobilePage(props:Props){

  const symbol='BTCUSDT'

  useVIPMarketStream(symbol,{ throttle:2000 })

  const whaleRatio = useVIPMarketStore(s=>s.whaleRatio)
  const whaleNet = useVIPMarketStore(s=>s.whaleNet)
  const whaleIntensity = useVIPMarketStore(s=>s.whaleIntensity)

  const long = Math.max(0, whaleNet*100)
  const short = Math.max(0, -whaleNet*100)

  const dominant =
    whaleNet>0.05 ? 'LONG' :
    whaleNet<-0.05 ? 'SHORT' :
    'NONE'

  const confidence = Math.min(Math.abs(whaleNet)*100,100)

  return(

  <main className="space-y-6 pb-20">

    <VIPTopKPIBar avoidedExtremeCount={0} />

    <VIPActionGateContextBar symbol={symbol} />

    <VIPLiveStatusStripMobile symbol={symbol} />

    <RawObservationBarMobile symbol={symbol} />

    <VIPWhaleIntensityMiniChart />

    <VIPWhaleFlowMiniChart />

    <VIPWhaleTradeGuideCardMobile
      ratio={whaleRatio}
      net={whaleNet}
    />

    <VIPInstitutionalGuideCardMobile
      long={long}
      short={short}
      confidence={confidence}
      dominant={dominant}
      intensity={whaleIntensity}
    />

    <VIPOverviewDashboardMobile/>

  </main>

  )
}
