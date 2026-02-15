// lib/market/sentimentRedisStore.ts

/**
 * ⚠️ DEPRECATED
 * Sentiment is now calculated & streamed in real-time via SSE.
 * Redis persistence is disabled.
 */

export async function saveSentiment(
  _symbol: string,
  _value: number,
): Promise<void> {
  // no-op
  return
}

export async function loadSentiment(
  _symbol: string,
): Promise<number | null> {
  return null
}
