'use client'

import VIP3AdvancedMetrics from '@/components/vip/VIP3AdvancedMetrics'

export default function VIPMetricsBoundary({ vip3Metrics }: any) {

  return (
    <VIP3AdvancedMetrics {...vip3Metrics} />
  )
}
