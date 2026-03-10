'use client'

import VIPWhaleTradeGuideCard from '@/components/vip/VIPWhaleTradeGuideCard'

type Props = {
  ratio:number
  net:number
}

export default function VIPWhaleTradeGuideCardMobile(props:Props){
  return <VIPWhaleTradeGuideCard {...props}/>
}
