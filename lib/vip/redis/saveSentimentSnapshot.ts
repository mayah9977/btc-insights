//lib/vip/redis/saveSentimentSnapshot.ts  

import { redis } from '@/lib/redis/server'
import { buildSentimentInterpretation } from '@/lib/analysis/sentimentInterpretation'

/**
 * Sentiment Snapshot Key (숫자 SSOT)
 */
const KEY = 'vip:intel:sentiment'

/**
 * Sentiment Interpretation Key (문장 SSOT)
 */
const TEXT_KEY = 'vip:intel:sentiment:text'

export type SentimentSnapshot = {
  index: number
  regime: 'FEAR' | 'NEUTRAL' | 'GREED'
  updatedAt: number
}

/**
 * 🧠 Save Sentiment Index Snapshot
 * - 숫자 저장
 * - 해석 문장 저장 (APP / PDF 공통 SSOT)
 */
export async function saveSentimentSnapshot(
  index: number,
) {
  let regime: SentimentSnapshot['regime'] = 'NEUTRAL'

  if (index < 35) regime = 'FEAR'
  else if (index > 65) regime = 'GREED'

  const snapshot: SentimentSnapshot = {
    index,
    regime,
    updatedAt: Date.now(),
  }

  /* 1️⃣ 숫자 저장 */
  await redis.set(KEY, JSON.stringify(snapshot))

  /* 2️⃣ 해석 문장 생성 */
  const interpretation = buildSentimentInterpretation(index)

  /* 3️⃣ 문장 저장 */
  await redis.set(TEXT_KEY, interpretation)
}

/**
 * 🧠 Get Sentiment Snapshot
 */
export async function getSentimentSnapshot(): Promise<SentimentSnapshot | null> {
  const raw = await redis.get(KEY)
  if (!raw) return null
  return JSON.parse(raw)
}
