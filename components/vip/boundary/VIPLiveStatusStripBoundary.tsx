'use client'

import VIPLiveStatusStrip from '@/components/vip/VIPLiveStatusStrip'
import { useVIPMarketStream } from '@/lib/realtime/useVIPMarketStream'

export default function VIPLiveStatusStripBoundary() {

  useVIPMarketStream('BTCUSDT')

  return <VIPLiveStatusStrip />
}
