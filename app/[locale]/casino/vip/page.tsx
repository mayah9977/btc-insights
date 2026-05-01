// app/[locale]/casino/vip/page.tsx

import { redirect } from 'next/navigation'
import { redis } from '@/lib/redis/index'
import VIPClientPage from './vipClientPage'
import VIPRealtimeBoundary from './VIPRealtimeBoundary'
import { getVIP3Metrics } from '@/lib/vip/redis/getVIP3Metrics'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { getUserVIPLevel } from '@/lib/vip/vipServer'

type PageProps = {
  params: Promise<{
    locale: string
  }>
}

export default async function VIPPage({ params }: PageProps) {
  const { locale } = await params

  // ✅ 로그인만 서버에서 체크
  const user = await getCurrentUser()

  if (!user) {
    redirect(`/${locale}/login`)
  }

  const userId = user.id

  // ✅ VIP 여부는 전달만 (redirect ❌)
  const vipLevel = await getUserVIPLevel(userId)
  const isVIP = vipLevel === 'VIP'

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
        isVIP={isVIP}
        weeklySummary={weeklySummary}
        monthlySummary={monthlySummary}
        vip3Metrics={vip3Metrics}
      />
    </VIPRealtimeBoundary>
  )
}
