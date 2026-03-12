'use client'

import dynamic from 'next/dynamic'

const VIPWhaleTradeFlowChart = dynamic(
  () => import('@/components/vip/VIPWhaleTradeFlowChart'),
  { ssr: false },
)

export default function VIPWhaleTradeFlowChartBoundary() {

  return (
    <VIPWhaleTradeFlowChart symbol="BTCUSDT" />
  )
}
