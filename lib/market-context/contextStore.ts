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
   Save Market Context (Institutional Safe Version)

   ✔ 새 데이터 유효할 때만 교체
   ✔ 기존 latest → previous 백업
   ✔ previous 24시간 보관
   ✔ 실패 시 기존 유지
   ✔ 실패 로깅
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

  if (!isValid) {
    console.warn('[ContextStore] ❌ Invalid context → keeping previous')

    const previousRaw = await redis.get(LATEST_KEY)
    if (previousRaw) {
      try {
        return JSON.parse(previousRaw) as StoredMarketContext
      } catch (err) {
        console.error('[ContextStore] JSON parse error (previous):', err)
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
       1️⃣ 기존 latest 백업
    =============================== */
    const currentLatest = await redis.get(LATEST_KEY)

    if (currentLatest) {
      await redis.set(
        PREVIOUS_KEY,
        currentLatest,
        'EX',
        60 * 60 * 24 // 24시간 유지
      )
    }

    /* ===============================
       2️⃣ 새 데이터 저장
    =============================== */
    await redis.set(
      LATEST_KEY,
      JSON.stringify(payload),
      'EX',
      60 * 60 * 12 // latest 12시간 유지
    )

    console.log('[ContextStore] ✅ Market context updated safely')

    return payload

  } catch (error) {
    console.error('[ContextStore] ❌ Save failed:', error)

    // 저장 실패 시 기존 유지
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
