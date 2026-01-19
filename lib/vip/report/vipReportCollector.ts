import { redis } from '@/lib/redis'

export async function collectVIPReportData() {
  const daily = await redis.get('vip:metrics:daily')
  const monthly = await redis.get('vip:metrics:monthly')
  const vip3 = await redis.get('vip:metrics:vip3')

  return {
    daily: daily ? JSON.parse(daily) : null,
    monthly: monthly ? JSON.parse(monthly) : null,
    vip3: vip3 ? JSON.parse(vip3) : null,
  }
}
