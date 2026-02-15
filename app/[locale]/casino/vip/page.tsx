import { redirect } from 'next/navigation'
import { redis } from '@/lib/redis/index'
import VIPClientPage from './vipClientPage'
import VIPRealtimeBoundary from './VIPRealtimeBoundary'
import { getVIP3Metrics } from '@/lib/vip/redis/getVIP3Metrics'
import { getSession } from '@/lib/auth/session'

type PageProps = {
  params: Promise<{
    locale: string
  }>
}

export default async function VIPPage({ params }: PageProps) {
  const { locale } = await params

  const session = await getSession()
  if (!session) {
    redirect(`/${locale}/login`)
  }

  const userId = session.userId

  let dailyMetrics = {
    avoidedExtremeCount: 0,
    avoidedLossUSD: 0,
  }

  try {
    const dailyRaw = await redis.get('vip:metrics:daily')
    if (dailyRaw) dailyMetrics = JSON.parse(dailyRaw)
  } catch {}

  const weeklySummary = {
    period: '7d' as const,
    avoidedExtremeCount: dailyMetrics.avoidedExtremeCount,
    avoidedLossUSD: dailyMetrics.avoidedLossUSD,
  }

  const monthlySummary = {
    period: '30d' as const,
    avoidedExtremeCount: dailyMetrics.avoidedExtremeCount,
    avoidedLossUSD: dailyMetrics.avoidedLossUSD,
  }

  const vip3Metrics = await getVIP3Metrics()

  return (
    <VIPRealtimeBoundary>
      <VIPClientPage
        userId={userId}
        weeklySummary={weeklySummary}
        monthlySummary={monthlySummary}
        vip3Metrics={vip3Metrics}
      />
    </VIPRealtimeBoundary>
  )
}
