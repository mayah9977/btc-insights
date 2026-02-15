import { redis } from '@/lib/redis'

/**
 * Redis Key 규칙
 * whale:intensity:history:{SYMBOL}
 * type: List
 */

const DEFAULT_HISTORY_LIMIT = 60 // 🔥 30 → 60 (더 부드러운 흐름)

/* =======================================================
 * Helpers
 * ======================================================= */

function historyKey(symbol: string) {
  return `whale:intensity:history:${symbol.toUpperCase()}`
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v))
}

/* =======================================================
 * 🔥 EMA Smoothing
 * ======================================================= */

function computeEMA(
  prev: number | null,
  current: number,
  alpha = 0.35, // 🔥 스무딩 강도
): number {
  if (prev === null) return current
  return prev * (1 - alpha) + current * alpha
}

/* =======================================================
 * Save (EMA + Trim + Spike Guard)
 * ======================================================= */

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
    options?.historyLimit ?? DEFAULT_HISTORY_LIMIT

  const alpha = options?.alpha ?? 0.35

  const key = historyKey(symbol)

  /* ---------------------------
   * 1️⃣ Load latest for EMA
   * --------------------------- */
  const lastRaw = await redis.lindex(key, 0)
  const prev =
    lastRaw !== null && Number.isFinite(Number(lastRaw))
      ? Number(lastRaw)
      : null

  /* ---------------------------
   * 2️⃣ Spike Guard
   * 급격한 2배 점프 완충
   * --------------------------- */
  let value = clamp01(rawValue)

  if (prev !== null) {
    const jump = Math.abs(value - prev)
    if (jump > 0.6) {
      // 🔥 과도 점프 완화
      value = prev + (value - prev) * 0.4
    }
  }

  /* ---------------------------
   * 3️⃣ EMA 적용
   * --------------------------- */
  const smoothed = clamp01(
    computeEMA(prev, value, alpha),
  )

  /* ---------------------------
   * 4️⃣ Save
   * --------------------------- */
  await redis.lpush(key, smoothed.toFixed(4))
  await redis.ltrim(key, 0, historyLimit - 1)
}

/* =======================================================
 * Load History (시간순 반환)
 * ======================================================= */

export async function loadWhaleIntensityHistory(
  symbol: string,
  historyLimit = DEFAULT_HISTORY_LIMIT,
): Promise<number[]> {
  const key = historyKey(symbol)

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
 * Hydrate to Memory (Boot)
 * ======================================================= */

export async function hydrateWhaleIntensityToMemory(
  symbol: string,
  setMemory: (symbol: string, values: number[]) => void,
) {
  const history = await loadWhaleIntensityHistory(symbol)

  if (history.length > 0) {
    setMemory(symbol.toUpperCase(), history)
    console.log(
      `[WhaleRedis] hydrated ${symbol} (${history.length})`,
    )
  }
}

/* =======================================================
 * Load All Symbols
 * ======================================================= */

export async function loadAllWhaleIntensityKeys(): Promise<string[]> {
  const keys = await redis.keys(
    'whale:intensity:history:*',
  )

  return keys.map(k =>
    k.replace('whale:intensity:history:', ''),
  )
}
