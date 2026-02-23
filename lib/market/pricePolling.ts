import { redis } from '@/lib/redis'
import { handlePriceTick } from '@/lib/alerts/alertEngine'
import { fetchCurrentMarketPrice } from '@/lib/market/fetchCurrentMarketPrice'

import { calculateMarketPressure } from '@/lib/market/marketPressure'
import { calculateRiskLevel } from '@/lib/vip/riskEngine'
import { broadcastVipRiskUpdate } from '@/lib/vip/vipSSEHub'

import type { RiskLevel } from '@/lib/vip/riskEngine'
import { interpretRealtimeRisk } from '@/lib/realtime/realtimeRiskInterpreter'

/* =========================
 * Internal State (SSOT)
 * ========================= */

const lastPriceMap: Record<string, number> = {}
const priceWindowMap: Record<string, number[]> = {}
const prevRiskLevelMap: Record<string, RiskLevel> = {}

/* =========================
 * REALTIME PRICE + QTY FEED
 * ========================= */

export async function onPriceUpdate(
  symbol: string,
  price: number,
  qty: number,
) {
  if (!symbol || !Number.isFinite(price) || !Number.isFinite(qty)) return

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

  /* =========================
   * 변동성 계산
   * ========================= */
  const { score: volatilityScore } =
    calculateMarketPressure(upper, price)

  /* =========================
   * 🔥 Risk 계산
   * (WhaleIntensity는 buildRiskInputFromRealtime에서만 계산)
   * ========================= */

  const extremeSignal =
    Math.abs(volatilityScore) > 0.35

  const nextRiskLevel = calculateRiskLevel({
    volatility: Math.abs(volatilityScore),
    aiScore: 60,
    whaleIntensity: 0, // ⚠ Pressure 엔진에서 계산됨
    extremeSignal,
  })

  const prevRiskLevel = prevRiskLevelMap[upper] ?? null
  if (prevRiskLevel === nextRiskLevel) return
  prevRiskLevelMap[upper] = nextRiskLevel

  /* =========================
   * 리스크 해석
   * ========================= */

  const interpreted = interpretRealtimeRisk({
    riskLevel: nextRiskLevel,
    prevRiskLevel,
    whaleIntensity: 0, // Pressure 엔진 SSOT 사용
    avgWhale: 0,
    whaleTrend: 'FLAT',
    isSpike: false,
  })

  /* =========================
   * VIP RISK UPDATE
   * ========================= */

  broadcastVipRiskUpdate({
    riskLevel: nextRiskLevel,
    judgement: interpreted.hint,
    confidence: interpreted.extremeProximity,
    isExtreme: nextRiskLevel === 'EXTREME',
    ts: Date.now(),
    pressureTrend: interpreted.pressureTrend,
    extremeProximity: interpreted.extremeProximity,
    preExtreme: interpreted.preExtreme,
    whaleAccelerated: interpreted.whaleAccelerated,
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

  if (typeof fetched !== 'number') return

  await handlePriceTick({
    symbol,
    price: fetched,
    mode: 'initial',
  })
}