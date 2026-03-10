'use client'

import dynamic from 'next/dynamic'

const MarketContextPanel = dynamic(
  () => import('@/components/market/context/MarketContextPanel')
    .then(mod => mod.MarketContextPanel),
  { ssr: false }
)

export default function VIPOverviewDashboardMobile(){

  return (

    <div className="px-4">

      <MarketContextPanel />

    </div>

  )

}
