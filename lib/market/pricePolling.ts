// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { redis } from '@/lib/redis'
import { handlePriceTick } from '@/lib/alerts/alertEngine'
import { fetchCurrentMarketPrice } from '@/lib/market/fetchCurrentMarketPrice'

import { calculateMarketPressure } from '@/lib/market/marketPressure'
import { calculateRiskLevel } from '@/lib/vip/riskEngine'
import { broadcastVipRiskUpdate } from '@/lib/vip/vipSSEHub'

import { saveWhaleIntensity } from '@/lib/market/whaleRedisStore'
import type { RiskLevel } from '@/lib/vip/riskEngine'

import { interpretRealtimeRisk } from '@/lib/realtime/realtimeRiskInterpreter'

// ✅ 추가
import { pushRealtimeUpdate } from '@/lib/realtime/pushRealtimeUpdate'
import { SSE_EVENT } from '@/lib/realtime/types'

/* =========================
 * Internal State (SSOT)
 * ========================= */

const lastPriceMap: Record<string, number> = {}
const priceWindowMap: Record<string, number[]> = {}
const lastOIMap: Record<string, number> = {}

const tradeVolumeWindowMap: Record<string, number[]> = {}
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

  /* 4️⃣ 변동성 */
  const { score: volatilityScore } =
    calculateMarketPressure(upper, price)

  /* =========================
   * 체결량 기반 분석
   * ========================= */

  const volumeWindow =
    tradeVolumeWindowMap[upper] ??
    (tradeVolumeWindowMap[upper] = [])

  const tradeUSD = qty * price

  volumeWindow.push(tradeUSD)
  if (volumeWindow.length > 20) volumeWindow.shift()

  const totalVolume = volumeWindow.reduce((a, b) => a + b, 0)
  const avgVolume = totalVolume / volumeWindow.length

  /* =========================
   * ✅ Volume SSE 송출 (핵심 추가)
   * ========================= */
  pushRealtimeUpdate({
    type: SSE_EVENT.VOLUME_TICK,
    symbol: upper,
    volume: Math.round(totalVolume),
    ts: Date.now(),
  })

  const isLargeTrade =
    tradeUSD > avgVolume * 3 && tradeUSD > 100_000

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

  const history =
    whaleIntensityHistoryMap[upper] ??
    (whaleIntensityHistoryMap[upper] = [])

  history.push(whaleIntensity)
  if (history.length > 30) history.shift()

  saveWhaleIntensity(upper, whaleIntensity)

  const avgWhale =
    history.reduce((a, b) => a + b, 0) / history.length

  const prev =
    history.length >= 2
      ? history[history.length - 2]
      : whaleIntensity

  const whaleTrend: 'UP' | 'DOWN' | 'FLAT' =
    whaleIntensity > prev
      ? 'UP'
      : whaleIntensity < prev
      ? 'DOWN'
      : 'FLAT'

  const isSpike = whaleIntensity > avgWhale * 1.3

  /* =========================
   * 🔥 Risk 계산
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

  const prevRiskLevel = prevRiskLevelMap[upper] ?? null
  if (prevRiskLevel === nextRiskLevel) return
  prevRiskLevelMap[upper] = nextRiskLevel

  /* =========================
   * 🔥 리스크 해석 (SSOT)
   * ========================= */

  const interpreted = interpretRealtimeRisk({
    riskLevel: nextRiskLevel,
    prevRiskLevel,
    whaleIntensity,
    avgWhale,
    whaleTrend,
    isSpike,
  })

  /* =========================
   * 📡 VIP RISK UPDATE
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
