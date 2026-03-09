'use client'

import { useVIPMarketStore } from '@/lib/market/store/vipMarketStore'
import { useEffect,useState } from 'react'

export default function VIPWhaleIntensityMiniChart(){

 const intensity = useVIPMarketStore(s=>s.whaleIntensity)

 const [history,setHistory] = useState<number[]>([])

 useEffect(()=>{

   const id=setInterval(()=>{

     setHistory(prev=>{
       const next=[...prev,intensity]
       return next.slice(-20)
     })

   },2000)

   return()=>clearInterval(id)

 },[intensity])

 return(

 <div className="p-4 border border-zinc-800 rounded">

   <div className="text-xs text-zinc-400 mb-2">
     Whale Intensity
   </div>

   <div className="flex gap-1 items-end h-16">

     {history.map((v,i)=>(
       <div
         key={i}
         style={{
           height:`${v}%`
         }}
         className="w-1 bg-red-500"
       />
     ))}

   </div>

 </div>

 )
}
