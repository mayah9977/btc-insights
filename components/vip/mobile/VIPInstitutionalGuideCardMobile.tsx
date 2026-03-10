'use client'

import VIPInstitutionalGuideCard from '@/components/vip/VIPInstitutionalGuideCard'

type Props = {
  long:number
  short:number
  confidence:number
  dominant:'LONG'|'SHORT'|'NONE'
  intensity:number
}

export default function VIPInstitutionalGuideCardMobile(props:Props){
  return <VIPInstitutionalGuideCard {...props}/>
}
