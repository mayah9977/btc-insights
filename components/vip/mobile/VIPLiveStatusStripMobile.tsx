'use client'

import { useRealtimeMarketComposite } from '@/lib/realtime/useRealtimeMarketComposite'

export default function VIPLiveStatusStripMobile({symbol}:{symbol:string}){

 const {
   oi,
   volume,
   whaleIntensity
 } = useRealtimeMarketComposite(symbol)

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
