'use client'

import dynamic from 'next/dynamic'
import ChartSkeleton from '@/components/ui/ChartSkeleton'

interface Props {
  symbol?: string
}

/* =========================================================
   Lazy Chart Import
========================================================= */

const VIPWhaleIntensityChart = dynamic(
  () => import('@/components/vip/VIPWhaleIntensityChart'),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  }
)

/* =========================================================
   Section Component
========================================================= */

export default function WhaleActivitySection({
  symbol = 'BTCUSDT',
}: Props) {

  return (
    <div className="w-full">
      <VIPWhaleIntensityChart symbol={symbol} />
    </div>
  )
}
