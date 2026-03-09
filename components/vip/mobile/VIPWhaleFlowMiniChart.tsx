'use client'

import { useVIPMarketStore } from '@/lib/market/store/vipMarketStore'
import { useEffect,useState } from 'react'

export default function VIPWhaleFlowMiniChart(){

 const net = useVIPMarketStore(s=>s.whaleNet)

 const [history,setHistory] = useState<number[]>([])

 useEffect(()=>{

   const id=setInterval(()=>{

     setHistory(prev=>{
       const next=[...prev,net]
       return next.slice(-20)
     })

   },2000)

   return()=>clearInterval(id)

 },[net])

 return(

 <div className="p-4 border border-zinc-800 rounded">

   <div className="text-xs text-zinc-400 mb-2">
     Whale Net Flow
   </div>

   <div className="flex gap-1 items-end h-16">

     {history.map((v,i)=>(
       <div
         key={i}
         style={{
           height:`${Math.abs(v)*100}%`
         }}
         className="w-1 bg-yellow-500"
       />
     ))}

   </div>

 </div>

 )
}
