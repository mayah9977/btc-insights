import { redis } from '@/lib/redis'
import { handlePriceTick } from '@/lib/alerts/alertEngine'
import { fetchCurrentMarketPrice } from '@/lib/market/fetchCurrentMarketPrice'

import { calculateMarketPressure } from '@/lib/market/marketPressure'
import { calculateRiskLevel } from '@/lib/vip/riskEngine'
import { broadcastVipRiskUpdate } from '@/lib/vip/vipSSEHub'

import { saveWhaleIntensity } from '@/lib/market/whaleRedisStore'
import type { RiskLevel } from '@/lib/vip/riskEngine'

/* =========================
 * Internal State (SSOT)
 * ========================= */

const lastPriceMap: Record<string, number> = {}
const priceWindowMap: Record<string, number[]> = {}

const lastOIMap: Record<string, number> = {}

// 🔥 체결량 윈도우 (USD 기준)
const tradeVolumeWindowMap: Record<string, number[]> = {}

// 🔥 whaleIntensity 히스토리
const whaleIntensityHistoryMap: Record<string, number[]> = {}

const prevRiskLevelMap: Record<string, RiskLevel> = {}

/* =========================
 * Cache API
 * ========================= */

export function updateOI(symbol: string, oi: number) {
  if (!Number.isFinite(oi)) return
  lastOIMap[symbol.toUpperCase()] = oi
}

export function getOI(symbol: string): number | undefined {
  return lastOIMap[symbol.toUpperCase()]
}

export function getWhaleIntensityHistory(symbol: string): number[] {
  return whaleIntensityHistoryMap[symbol.toUpperCase()] ?? []
}

export function setWhaleIntensityHistory(
  symbol: string,
  values: number[],
) {
  const upper = symbol.toUpperCase()
  whaleIntensityHistoryMap[upper] = values
    .map(v => Number(v))
    .filter(v => Number.isFinite(v))
    .slice(-30)
}

/* =========================
 * REALTIME PRICE + QTY FEED
 * ========================= */

export async function onPriceUpdate(
  symbol: string,
  price: number,
  qty: number,
) {
  if (
    !symbol ||
    !Number.isFinite(price) ||
    !Number.isFinite(qty)
  ) {
    return
  }

  const upper = symbol.toUpperCase()

  /* 1️⃣ 가격 캐시 */
  lastPriceMap[upper] = price

  /* 2️⃣ Alert Engine */
  await handlePriceTick({
    symbol: upper,
    price,
    mode: 'tick',
  })

  /* 3️⃣ 가격 윈도우 */
  const priceWindow =
    priceWindowMap[upper] ?? (priceWindowMap[upper] = [])

  priceWindow.push(price)
  if (priceWindow.length > 30) priceWindow.shift()
  if (priceWindow.length < 10) return

  /* 4️⃣ 변동성 */
  const { score: volatilityScore } =
    calculateMarketPressure(upper, price)

  /* =========================
   * 🔥 체결량 기반 분석 (USD 기준)
   * ========================= */

  const volumeWindow =
    tradeVolumeWindowMap[upper] ??
    (tradeVolumeWindowMap[upper] = [])

  // ✅ 핵심: USD 체결량
  const tradeUSD = qty * price

  volumeWindow.push(tradeUSD)
  if (volumeWindow.length > 20) volumeWindow.shift()

  const totalVolume = volumeWindow.reduce((a, b) => a + b, 0)
  const avgVolume = totalVolume / volumeWindow.length

  // 🔥 최소 10만 달러급 체결
  const isLargeTrade =
    tradeUSD > avgVolume * 3 &&
    tradeUSD > 100_000

  /* =========================
   * 📊 UI용 체결량 (USD)
   * ========================= */

  await redis.publish(
    'realtime:market',
    JSON.stringify({
      type: 'VOLUME_TICK',
      symbol: upper,
      volume: totalVolume, // ✅ USD 기준
      ts: Date.now(),
    }),
  )

  /* =========================
   * 🐋 whaleIntensity 계산
   * ========================= */

  const oi = getOI(upper)
  let whaleIntensity = 0

  if (typeof oi === 'number') {
    const oiScore = Math.min(1, oi / 1_000_000_000)
    const volumeScore = Math.min(1, totalVolume / 500_000)

    whaleIntensity = oiScore * 0.5 + volumeScore * 0.5

    if (isLargeTrade) whaleIntensity += 0.15

    whaleIntensity = Math.min(1, whaleIntensity)
  }

  /* =========================
   * 히스토리 + Redis
   * ========================= */

  const history =
    whaleIntensityHistoryMap[upper] ??
    (whaleIntensityHistoryMap[upper] = [])

  history.push(whaleIntensity)
  if (history.length > 30) history.shift()

  saveWhaleIntensity(upper, whaleIntensity)

  const avgWhale =
    history.reduce((a, b) => a + b, 0) / history.length

  await redis.publish(
    'realtime:market',
    JSON.stringify({
      type: 'WHALE_INTENSITY_TICK',
      symbol: upper,
      value: whaleIntensity,
      avg: avgWhale,
      ts: Date.now(),
    }),
  )

  /* =========================
   * 🚨 고래 경보 (USD 기준)
   * ========================= */

  if (
    isLargeTrade &&
    whaleIntensity > 0.6 &&
    whaleIntensity > avgWhale * 1.3
  ) {
    await redis.publish(
      'realtime:market',
      JSON.stringify({
        type: 'WHALE_WARNING',
        symbol: upper,
        whaleIntensity,
        avgWhale,
        tradeUSD,
        ts: Date.now(),
      }),
    )
  }

  /* =========================
   * Risk 계산
   * ========================= */

  const extremeSignal =
    whaleIntensity > 0.85 &&
    Math.abs(volatilityScore) > 0.25

  const nextRiskLevel = calculateRiskLevel({
    volatility: Math.abs(volatilityScore),
    aiScore: 60,
    whaleIntensity,
    extremeSignal,
  })

  if (prevRiskLevelMap[upper] === nextRiskLevel) return
  prevRiskLevelMap[upper] = nextRiskLevel

  broadcastVipRiskUpdate({
    riskLevel: nextRiskLevel,
    judgement:
      nextRiskLevel === 'EXTREME'
        ? '대량 USD 체결 + 고래 집중'
        : nextRiskLevel === 'HIGH'
        ? '고래 체결 증가'
        : nextRiskLevel === 'MEDIUM'
        ? '거래량 증가'
        : '시장 안정',
    isExtreme: nextRiskLevel === 'EXTREME',
    ts: Date.now(),
  })
}

/* =========================
 * Force Evaluate
 * ========================= */

export async function forceEvaluatePrice(params: {
  symbol: string
}) {
  const symbol = params.symbol.toUpperCase()

  const fetched = await fetchCurrentMarketPrice(symbol)

  if (typeof fetched !== 'number' || !Number.isFinite(fetched)) {
    return
  }

  await handlePriceTick({
    symbol,
    price: fetched,
    mode: 'initial',
  })
}
