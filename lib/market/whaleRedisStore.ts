// lib/market/whaleRedisStore.ts

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

/**
 * 🔥 WhaleIntensity SSOT
 * 내부 기준은 무조건 0~100 scale.
 */
function clamp100(v: number) {
  return Math.max(0, Math.min(100, v))
}

/**
 * 🔥 Legacy scale guard
 *
 * Redis history에 남아 있는 구버전 0~1 데이터를
 * 자동으로 0~100 scale로 승격합니다.
 *
 * 0.72 → 72
 * 0.81 → 81
 * 45   → 45
 */
function normalizeWhaleIntensityScale(v: number) {
  if (!Number.isFinite(v)) return 0

  if (v <= 1) {
    return clamp100(v * 100)
  }

  return clamp100(v)
}

/**
 * TradeFlow ratio는 기존대로 0~1 유지.
 * WhaleIntensity scale과 분리합니다.
 */
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

  /**
   * 🔥 Redis legacy history normalize
   *
   * prev가 구버전 0~1 값이어도
   * EMA / spike guard 전에 반드시 0~100으로 변환합니다.
   */
  const prev =
    lastRaw !== null && Number.isFinite(Number(lastRaw))
      ? normalizeWhaleIntensityScale(Number(lastRaw))
      : null

  /**
   * 🔥 Save input normalize
   *
   * rawValue가 0~1로 들어오든 0~100으로 들어오든
   * Redis에는 항상 0~100 기준으로 저장합니다.
   */
  let value = normalizeWhaleIntensityScale(rawValue)

  /**
   * Spike Guard
   *
   * 기존 구조 유지.
   * 단, scale이 0~100으로 통일되었으므로
   * 기존 0.6 threshold는 60으로 변환합니다.
   */
  if (prev !== null) {
    const jump = Math.abs(value - prev)

    if (jump > 60) {
      value = prev + (value - prev) * 0.4
    }
  }

  const smoothed = clamp100(
    computeEMA(prev, value, alpha),
  )

  console.log(
    '[WhaleRedis:save]',
    {
      symbol,

      rawValue,

      normalizedValue: value,

      prev,

      alpha,

      smoothed,

      jump:
        prev != null
          ? Math.abs(value - prev)
          : null,
    },
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

  console.log(
    '[WhaleRedis:load]',
    {
      symbol,

      raw,

      normalized: raw.map((v) =>
        normalizeWhaleIntensityScale(
          Number(v),
        ),
      ),
    },
  )

  /**
   * 🔥 History load normalize
   *
   * Redis 안에 0~1 legacy value와 0~100 신규 value가 섞여 있어도
   * load 시점에 모두 0~100으로 통일합니다.
   *
   * 이 결과 avg / trend / spike 계산이 scale corruption 없이 동작합니다.
   */
  return raw
    .map((v) => Number(v))
    .filter((v) => Number.isFinite(v))
    .map((v) => normalizeWhaleIntensityScale(v))
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

  /**
   * TradeFlow는 ratio 데이터이므로 기존 0~1 scale 유지.
   * WhaleIntensity SSOT 0~100 변경과 분리합니다.
   */
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
    .map((v) => Number(v))
    .filter((v) => Number.isFinite(v))
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

  return keys.map((k) =>
    k.replace('whale:intensity:history:', ''),
  )
}
