import { redis } from '@/lib/redis/server'

if (typeof window !== 'undefined') {
  throw new Error('[ContextStore] imported on client. Forbidden.')
}

const CONTEXT_KEY = 'market:context:latest'

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

export async function saveMarketContext(
  data: Omit<StoredMarketContext, 'updatedAt'>
) {
  const payload: StoredMarketContext = {
    ...data,
    updatedAt: Date.now(),
  }

  await redis.set(
    CONTEXT_KEY,
    JSON.stringify(payload),
    'EX',
    60 * 60 * 12
  )

  return payload
}

export async function getMarketContext(): Promise<
  StoredMarketContext | null
> {
  const raw = await redis.get(CONTEXT_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as StoredMarketContext
  } catch (error) {
    console.error('[ContextStore] JSON parse error:', error)
    return null
  }
}
