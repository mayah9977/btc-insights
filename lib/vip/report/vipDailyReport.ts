import { redis } from '@/lib/redis'

export async function generateVIPDailyReport() {
  const raw = await redis.get('vip:metrics:daily')
  if (!raw) return null

  const data = JSON.parse(raw)

  return {
    title: 'Daily VIP Risk Report',
    summary: `
오늘 EXTREME 회피 ${data.avoidedExtremeCount}회
추정 손실 회피 $${data.avoidedLossUSD}
`,
    generatedAt: new Date().toISOString(),
  }
}
