import { createAlert } from '@/lib/alerts/alertStore.server'

/**
 * 변동성 기반 자동 알림 생성 (SERVER ONLY)
 * - PERCENT 조건 제거
 * - 가격 기준 ABOVE 알림으로 변환
 */
export async function autoCreateVolatilityAlert(params: {
  userId: string
  symbol: string
  prices: number[]
}) {
  const { userId, symbol, prices } = params

  if (prices.length < 20) return null

  const avg =
    prices.reduce((a, b) => a + b, 0) / prices.length

  const variance =
    prices.reduce((s, p) => s + (p - avg) ** 2, 0) /
    prices.length

  const volatility = Math.sqrt(variance) / avg

  // 🔥 변동성 임계치 (3%)
  if (volatility < 0.03) return null

  // 변동성 % → 목표 가격 (상단)
  const percent = Math.round(volatility * 100)
  const targetPrice = Math.round(
    avg * (1 + percent / 100)
  )

  return await createAlert({
    userId,
    exchange: 'BINANCE',
    symbol,
    condition: 'ABOVE', // ✅ 허용된 조건만 사용
    targetPrice,

    repeatMode: 'REPEAT',
    cooldownMs: 30 * 60 * 1000, // 30분
    memo: `AI 자동 생성: 변동성 ${percent}%`,
  })
}
