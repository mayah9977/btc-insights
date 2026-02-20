import { redis } from '@/lib/redis/server'

export interface OnchainMetricsSnapshot {
  exchangeNetflow: number
  activeAddresses: number
  sopr: number
  mvrv: number
  whaleBalanceChange: number
}

function toNum(v: unknown, fallback = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

export async function fetchOnchainMetrics(): Promise<OnchainMetricsSnapshot> {
  const [
    netflow,
    activeAddr,
    sopr,
    mvrv,
    whaleBalance,
  ] = await Promise.all([
    redis.get('onchain:exchange:netflow'),
    redis.get('onchain:active:addresses'),
    redis.get('onchain:sopr'),
    redis.get('onchain:mvrv'),
    redis.get('onchain:whale:balance-change'),
  ])

  return {
    exchangeNetflow: toNum(netflow),
    activeAddresses: toNum(activeAddr),
    sopr: toNum(sopr),
    mvrv: toNum(mvrv),
    whaleBalanceChange: toNum(whaleBalance),
  }
}
