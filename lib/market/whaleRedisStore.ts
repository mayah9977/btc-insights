import { redis } from '@/lib/redis'

/**
 * Redis Key 규칙
 *
 * Pressure:
 * whale:intensity:history:{SYMBOL}
 *
 * Trade Flow:
 * whale:tradeflow:history:{SYMBOL}
 */

const DEFAULT_PRESSURE_LIMIT = 60
const DEFAULT_TRADEFLOW_LIMIT = 60

/* =======================================================
 * Helpers
======================================================= */

function pressureKey(symbol: string) {
  return `whale:intensity:history:${symbol.toUpperCase()}`
}

function tradeFlowKey(symbol: string) {
  return `whale:tradeflow:history:${symbol.toUpperCase()}`
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v))
}

/* =======================================================
 * 🔥 EMA Smoothing (Pressure 전용)
======================================================= */

function computeEMA(
  prev: number | null,
  current: number,
  alpha = 0.35,
): number {
  if (prev === null) return current
  return prev * (1 - alpha) + current * alpha
}

/* =======================================================
 * 🐋 Whale Pressure (Composite Index)
======================================================= */

export async function saveWhaleIntensity(
  symbol: string,
  rawValue: number,
  options?: {
    historyLimit?: number
    alpha?: number
  },
) {
  if (!Number.isFinite(rawValue)) return

  const historyLimit =
    options?.historyLimit ?? DEFAULT_PRESSURE_LIMIT

  const alpha = options?.alpha ?? 0.35

  const key = pressureKey(symbol)

  const lastRaw = await redis.lindex(key, 0)
  const prev =
    lastRaw !== null && Number.isFinite(Number(lastRaw))
      ? Number(lastRaw)
      : null

  let value = clamp01(rawValue)

  /* Spike Guard */
  if (prev !== null) {
    const jump = Math.abs(value - prev)
    if (jump > 0.6) {
      value = prev + (value - prev) * 0.4
    }
  }

  const smoothed = clamp01(
    computeEMA(prev, value, alpha),
  )

  await redis.lpush(key, smoothed.toFixed(4))
  await redis.ltrim(key, 0, historyLimit - 1)
}

export async function loadWhaleIntensityHistory(
  symbol: string,
  historyLimit = DEFAULT_PRESSURE_LIMIT,
): Promise<number[]> {
  const key = pressureKey(symbol)

  const raw = await redis.lrange(
    key,
    0,
    historyLimit - 1,
  )

  return raw
    .map(v => Number(v))
    .filter(v => Number.isFinite(v))
    .reverse()
}

/* =======================================================
 * 🆕 Whale Trade Flow (AggTrade 기반)
======================================================= */

export async function saveWhaleTradeFlow(
  symbol: string,
  rawRatio: number,
  historyLimit = DEFAULT_TRADEFLOW_LIMIT,
) {
  if (!Number.isFinite(rawRatio)) return

  const key = tradeFlowKey(symbol)
  const value = clamp01(rawRatio)

  await redis.lpush(key, value.toFixed(4))
  await redis.ltrim(key, 0, historyLimit - 1)
}

export async function loadWhaleTradeFlowHistory(
  symbol: string,
  historyLimit = DEFAULT_TRADEFLOW_LIMIT,
): Promise<number[]> {
  const key = tradeFlowKey(symbol)

  const raw = await redis.lrange(
    key,
    0,
    historyLimit - 1,
  )

  return raw
    .map(v => Number(v))
    .filter(v => Number.isFinite(v))
    .reverse()
}

/* =======================================================
 * Boot Hydration (Pressure 전용 유지)
======================================================= */

export async function hydrateWhaleIntensityToMemory(
  symbol: string,
  setMemory: (symbol: string, values: number[]) => void,
) {
  const history =
    await loadWhaleIntensityHistory(symbol)

  if (history.length > 0) {
    setMemory(symbol.toUpperCase(), history)
    console.log(
      `[WhaleRedis] hydrated pressure ${symbol} (${history.length})`,
    )
  }
}

/* =======================================================
 * Load All Pressure Symbols
======================================================= */

export async function loadAllWhaleIntensityKeys(): Promise<string[]> {
  const keys = await redis.keys(
    'whale:intensity:history:*',
  )

  return keys.map(k =>
    k.replace('whale:intensity:history:', ''),
  )
}
