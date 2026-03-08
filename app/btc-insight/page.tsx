'use client'

import dynamic from 'next/dynamic'

import InsightSectionAccordion from '@/components/insights/InsightSectionAccordion'

import { ActionGateStatus } from '@/components/system/ActionGateStatus'
import { RawObservationBar } from '@/components/market/observation/RawObservationBar'

import ChartSkeleton from '@/components/ui/ChartSkeleton'

/* =========================================
   Lazy Loaded Components
========================================= */

const WhaleActivityChart = dynamic(
  () => import('@/components/vip/VIPWhaleIntensityChart'),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  }
)

const InstitutionalFlowChart = dynamic(
  () => import('@/components/vip/VIPWhaleTradeFlowChart'),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  }
)

const AIAnalysisPanel = dynamic(
  () => import('@/components/insights/AIAnalysisPanel'),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  }
)

const WhaleReportPanel = dynamic(
  () => import('@/components/vip/VIPWhaleReportPanel'),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  }
)

/* =========================================
   Page Component
========================================= */

export default function BTCInsightPage() {
  const symbol = 'BTCUSDT'

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">

      {/* ========================================
         Always Visible
      ======================================== */}

      <div className="space-y-4 mb-6">
        <ActionGateStatus />
        <RawObservationBar symbol={symbol} />
      </div>

      {/* ========================================
         Mobile Layout (Accordion)
      ======================================== */}

      <div className="block lg:hidden space-y-2">

        <InsightSectionAccordion title="Whale Activity Chart">
          <WhaleActivityChart symbol={symbol} />
        </InsightSectionAccordion>

        <InsightSectionAccordion title="Institutional Flow Chart">
          <InstitutionalFlowChart symbol={symbol} />
        </InsightSectionAccordion>

        <InsightSectionAccordion title="AI Analysis">
          <AIAnalysisPanel />
        </InsightSectionAccordion>

        <InsightSectionAccordion title="Whale Report">
          <WhaleReportPanel />
        </InsightSectionAccordion>

      </div>

      {/* ========================================
         Desktop Layout (Grid Dashboard)
      ======================================== */}

      <div className="hidden lg:grid grid-cols-2 gap-6">

        <WhaleActivityChart symbol={symbol} />

        <InstitutionalFlowChart symbol={symbol} />

        <AIAnalysisPanel />

        <WhaleReportPanel />

      </div>

    </div>
  )
}
