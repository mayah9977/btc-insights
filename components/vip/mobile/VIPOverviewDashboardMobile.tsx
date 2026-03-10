'use client'

import dynamic from 'next/dynamic'

import VIPReportDownloadCard from './VIPReportDownloadCard'

const MarketContextPanel = dynamic(
  () =>
    import('@/components/market/context/MarketContextPanel')
      .then(mod => mod.MarketContextPanel),
  { ssr: false }
)

export default function VIPOverviewDashboardMobile(){

  return (

    <div className="space-y-6">

      {/* VIP Report Download */}

      <VIPReportDownloadCard />

      {/* Market Context */}

      <MarketContextPanel />

    </div>

  )

}
