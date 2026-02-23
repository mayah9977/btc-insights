/* =========================================================
   Sentiment SSOT (In-Memory Store)
   - Used for SSE replay
========================================================= */

let lastSentiment: number | null = null
let lastUpdated: number | null = null

export function setLastSentiment(value: number) {
  lastSentiment = value
  lastUpdated = Date.now()
}

export function getLastSentiment(): number | null {
  return lastSentiment
}

export function getLastSentimentTimestamp(): number | null {
  return lastUpdated
}