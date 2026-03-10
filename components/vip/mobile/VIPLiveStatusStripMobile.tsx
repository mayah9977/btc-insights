'use client'

import { useVIPMarketStore } from '@/lib/market/store/vipMarketStore'

export default function VIPLiveStatusStripMobile(){

 const oi = useVIPMarketStore(s=>s.oi)
 const volume = useVIPMarketStore(s=>s.volume)
 const whaleIntensity = useVIPMarketStore(s=>s.whaleIntensity)

 return(
  <div className="px-4 py-2 text-sm flex justify-between bg-zinc-900 border-b border-zinc-800">

   <div>
    OI {oi?.toLocaleString() ?? '--'}
   </div>

   <div>
    Vol {volume?.toLocaleString() ?? '--'}
   </div>

   <div>
    Whale {(whaleIntensity ?? 0).toFixed(2)}
   </div>

  </div>
 )
}
