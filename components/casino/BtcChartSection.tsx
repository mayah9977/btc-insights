'use client'

import dynamic from 'next/dynamic'

const BtcLiveChart = dynamic(
  () => import('@/components/charts/BtcLiveChart'),
  { ssr: false }
)

export default function BtcChartSection() {
  return (
    <section>
      <BtcLiveChart riskLevel="LOW" />
    </section>
  )
}
