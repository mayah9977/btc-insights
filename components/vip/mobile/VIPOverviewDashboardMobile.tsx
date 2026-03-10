'use client'

import dynamic from 'next/dynamic'

const VIPOverviewDashboard = dynamic(
  () =>
    import('@/components/vip/VIPOverviewDashboard')
      .then(mod => mod.VIPOverviewDashboard),
  { ssr: false }
)

export default function VIPOverviewDashboardMobile(){

  return (

    <div className="px-4">

      <VIPOverviewDashboard />

    </div>

  )

}
