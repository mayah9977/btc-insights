import { redis } from '@/lib/redis/index'


/**
 * OI Poller
 * - Open Interest 전용
 * - Alert / Toast / Push 와 완전히 분리
 * - realtime:oi 채널 사용
 */
export async function publishOITick(params: {
  symbol: string
  openInterest: number
}) {
  const { symbol, openInterest } = params

  await redis.publish(
    'realtime:oi',
    JSON.stringify({
      type: 'OI_TICK',
      symbol,
      openInterest,
      ts: Date.now(),
    }),
  )
}
