'use client'

import { useVipKpi } from '@/lib/vip/useVipKpi'
import VIPTopKPIBar from '@/components/vip/VIPTopKPIBar'

export default function VIPKpiBoundary() {

  const { avoidedExtremeCount = 0, avoidedLossUSD = 0 } = useVipKpi()

  return (
    <VIPTopKPIBar
      avoidedExtremeCount={avoidedExtremeCount}
      avoidedLossUSD={avoidedLossUSD}
    />
  )
}
