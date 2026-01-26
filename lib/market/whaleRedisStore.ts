import { redis } from '@/lib/redis'

/**
 * Redis Key 규칙
 * whale:intensity:history:{SYMBOL}
 * type: List
 * length: 최대 30
 */

const HISTORY_LIMIT = 30

function historyKey(symbol: string) {
  return `whale:intensity:history:${symbol.toUpperCase()}`
}

/* =========================
 * Save (append + trim)
 * ========================= */
export async function saveWhaleIntensity(
  symbol: string,
  value: number,
) {
  if (!Number.isFinite(value)) return

  const key = historyKey(symbol)

  // LPUSH → 최신이 앞
  await redis.lpush(key, value.toString())

  // 길이 제한 (0 ~ 29)
  await redis.ltrim(key, 0, HISTORY_LIMIT - 1)
}

/* =========================
 * Load single symbol history
 * ========================= */
export async function loadWhaleIntensityHistory(
  symbol: string,
): Promise<number[]> {
  const key = historyKey(symbol)

  const raw = await redis.lrange(key, 0, HISTORY_LIMIT - 1)

  // Redis는 최신이 앞 → 시간순 정렬
  return raw
    .map(v => Number(v))
    .filter(v => Number.isFinite(v))
    .reverse()
}

/* =========================
 * Hydrate to memory (on boot)
 * ========================= */
export async function hydrateWhaleIntensityToMemory(
  symbol: string,
  setMemory: (symbol: string, values: number[]) => void,
) {
  const history = await loadWhaleIntensityHistory(symbol)

  if (history.length > 0) {
    setMemory(symbol.toUpperCase(), history)
    console.log(
      `[WhaleRedis] hydrated ${symbol} history (${history.length})`,
    )
  }
}

/* =========================
 * (선택) 전체 심볼 로드
 * ========================= */
export async function loadAllWhaleIntensityKeys(): Promise<string[]> {
  const keys = await redis.keys(
    'whale:intensity:history:*',
  )

  return keys.map(k =>
    k.replace('whale:intensity:history:', ''),
  )
}
