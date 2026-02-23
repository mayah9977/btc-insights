/* =========================================================
   Alternative.me Fear & Greed Index Fetcher
   - Server Only
   - Returns numeric index (0~100)
========================================================= */

if (typeof window !== 'undefined') {
  throw new Error('[FearGreed] server-only module')
}

interface FearGreedApiResponse {
  data?: Array<{
    value: string
    value_classification: string
    timestamp: string
  }>
}

export async function fetchFearGreedIndex(): Promise<number | null> {
  try {
    const res = await fetch(
      'https://api.alternative.me/fng/?limit=1',
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        next: { revalidate: 0 }, // always fresh
      },
    )

    if (!res.ok) {
      console.error('[FearGreed] API error', res.status)
      return null
    }

    const json: FearGreedApiResponse = await res.json()

    const raw = json?.data?.[0]?.value
    const num = Number(raw)

    if (!Number.isFinite(num)) {
      console.error('[FearGreed] invalid value', raw)
      return null
    }

    return Math.max(0, Math.min(100, num))
  } catch (err) {
    console.error('[FearGreed] fetch failed', err)
    return null
  }
}
