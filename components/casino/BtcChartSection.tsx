'use client'

import dynamic from 'next/dynamic'

const BtcLiveChart = dynamic(
  () => import('@/components/charts/BtcLiveChart'),
  { ssr: false }
)

export default function BtcChartSection() {
  return (
    <div className="max-w-6xl mx-auto px-4">
      <BtcLiveChart riskLevel="LOW" />
    </div>
  )
}
