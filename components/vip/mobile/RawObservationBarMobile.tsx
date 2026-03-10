'use client'

import { useVIPMarketStore } from '@/lib/market/store/vipMarketStore'

export default function RawObservationBarMobile(){

 const oi = useVIPMarketStore(s=>s.oi)
 const vol = useVIPMarketStore(s=>s.volume)
 const fund = useVIPMarketStore(s=>s.fundingRate)

 return(
  <div className="grid grid-cols-3 gap-3 px-4 py-3 text-sm bg-black border-b border-zinc-800">

   <div>
    OI
    <div className="text-green-400">
     {oi?.toLocaleString() ?? '--'}
    </div>
   </div>

   <div>
    VOL
    <div className="text-green-400">
     {vol?.toLocaleString() ?? '--'}
    </div>
   </div>

   <div>
    FUNDING RATE
    <div className="text-green-400">
     {fund?.toFixed(4) ?? '--'}
    </div>
   </div>

  </div>
 )
}
