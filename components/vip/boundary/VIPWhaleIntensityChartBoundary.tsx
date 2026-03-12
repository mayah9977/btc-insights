'use client'

import dynamic from 'next/dynamic'

const VIPWhaleIntensityChart = dynamic(
  () => import('@/components/vip/VIPWhaleIntensityChart'),
  { ssr: false },
)

export default function VIPWhaleIntensityChartBoundary() {

  return (
    <VIPWhaleIntensityChart symbol="BTCUSDT" />
  )
}
