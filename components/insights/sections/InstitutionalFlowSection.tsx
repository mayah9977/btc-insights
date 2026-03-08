'use client'

import dynamic from 'next/dynamic'
import ChartSkeleton from '@/components/ui/ChartSkeleton'

interface Props {
  symbol?: string
}

/* =========================================================
   Lazy Chart Import
========================================================= */

const VIPWhaleTradeFlowChart = dynamic(
  () => import('@/components/vip/VIPWhaleTradeFlowChart'),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  }
)

/* =========================================================
   Section Component
========================================================= */

export default function InstitutionalFlowSection({
  symbol = 'BTCUSDT',
}: Props) {

  return (
    <div className="w-full">
      <VIPWhaleTradeFlowChart symbol={symbol} />
    </div>
  )
}
