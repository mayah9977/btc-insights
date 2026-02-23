import { redis } from '@/lib/redis/server'

if (typeof window !== 'undefined') {
  throw new Error('[ContextStore] imported on client. Forbidden.')
}

const LATEST_KEY = 'market:context:latest'
const PREVIOUS_KEY = 'market:context:previous'

/* =========================================================
   Stored Market Context (SSOT)
========================================================= */

export interface StoredMarketContext {
  headlines: {
    source: string
    title: string
    link?: string
    pubDate?: string
  }[]
  translatedHeadlines: string[]
  summary: string
  midLongTerm: string
  updatedAt: number
}

/* =========================================================
   Save Market Context (Final Stabilized Version)

   ✔ 새 데이터 유효할 때만 교체
   ✔ latest는 절대 expire 안 함
   ✔ previous는 48시간 유지
   ✔ 저장 실패 시 기존 latest 유지
========================================================= */

export async function saveMarketContext(
  data: Omit<StoredMarketContext, 'updatedAt'>
): Promise<StoredMarketContext> {

  const isValid =
    data.summary &&
    data.summary.trim().length > 20 &&
    data.midLongTerm &&
    data.midLongTerm.trim().length > 20 &&
    data.translatedHeadlines &&
    data.translatedHeadlines.length > 0

  /* ===============================
     ❌ 유효하지 않으면 기존 latest 유지
  =============================== */
  if (!isValid) {
    console.warn('[ContextStore] ❌ Invalid context → keeping latest')

    const latestRaw = await redis.get(LATEST_KEY)
    if (latestRaw) {
      try {
        return JSON.parse(latestRaw) as StoredMarketContext
      } catch (err) {
        console.error('[ContextStore] latest JSON parse error:', err)
      }
    }

    throw new Error('Invalid market context and no previous data available')
  }

  const payload: StoredMarketContext = {
    ...data,
    updatedAt: Date.now(),
  }

  try {
    /* ===============================
       1️⃣ 기존 latest → previous (48시간 유지)
    =============================== */
    const currentLatest = await redis.get(LATEST_KEY)

    if (currentLatest) {
      await redis.set(
        PREVIOUS_KEY,
        currentLatest,
        'EX',
        60 * 60 * 48 // ✅ 48시간 유지
      )
    }

    /* ===============================
       2️⃣ latest 저장 (TTL 제거)
    =============================== */
    await redis.set(
      LATEST_KEY,
      JSON.stringify(payload)
      // ❗ EX 제거 → 절대 만료되지 않음
    )

    console.log('[ContextStore] ✅ Market context updated (no TTL)')

    return payload

  } catch (error) {
    console.error('[ContextStore] ❌ Save failed:', error)

    const fallback = await redis.get(LATEST_KEY)
    if (fallback) {
      return JSON.parse(fallback) as StoredMarketContext
    }

    throw error
  }
}

/* =========================================================
   Get Market Context
========================================================= */

export async function getMarketContext(): Promise<StoredMarketContext | null> {
  const raw = await redis.get(LATEST_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as StoredMarketContext
  } catch (error) {
    console.error('[ContextStore] JSON parse error:', error)
    return null
  }
}