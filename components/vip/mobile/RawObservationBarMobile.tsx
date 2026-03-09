'use client'

import { useRealtimeOI } from '@/lib/realtime/useRealtimeOI'
import { useRealtimeVolume } from '@/lib/realtime/useRealtimeVolume'
import { useRealtimeFundingRate } from '@/lib/realtime/useRealtimeFundingRate'

export default function RawObservationBarMobile({symbol}:{symbol:string}){

 const oi=useRealtimeOI(symbol)
 const vol=useRealtimeVolume(symbol)
 const fund=useRealtimeFundingRate(symbol)

 return(

 <div className="grid grid-cols-3 gap-3 px-4 py-3 text-sm bg-black border-b border-zinc-800">

   <div>
     OI
     <div className="text-green-400">
       {oi.openInterest?.toLocaleString() ?? '--'}
     </div>
   </div>

   <div>
     VOL
     <div className="text-green-400">
       {vol.volume?.toLocaleString() ?? '--'}
     </div>
   </div>

   <div>
     FUND
     <div className="text-green-400">
       {fund.fundingRate?.toFixed(4) ?? '--'}
     </div>
   </div>

 </div>

 )
}
