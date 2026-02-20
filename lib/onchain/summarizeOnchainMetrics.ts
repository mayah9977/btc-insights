/* =========================================================
   Internal On-chain Metrics Summarizer
   - GPT 기반
   - Snapshot Hash Cache (24h)
========================================================= */

import { generateChatCompletion } from '@/lib/openai/server'
import { redis } from '@/lib/redis/server'
import { sha256 } from '@/lib/utils/hash'
import type { OnchainMetricsSnapshot } from './fetchOnchainMetrics'

export async function summarizeOnchainMetrics(
  metrics: OnchainMetricsSnapshot,
): Promise<string> {

  /* 🔥 1️⃣ Snapshot 기반 캐시 키 생성 */
  const snapshotString = JSON.stringify(metrics)
  const cacheKey = `gpt:onchain:internal:${sha256(snapshotString)}`

  const cached = await redis.get(cacheKey)
  if (cached) {
    return cached
  }

  const systemPrompt = `
You are a professional institutional crypto on-chain analyst.

Rules:
- Maximum 6 bullet points
- Focus on BTC short-term positioning
- Highlight risk bias
- Output in Korean
- No marketing tone
`

  const userPrompt = `
Exchange Netflow: ${metrics.exchangeNetflow}
Active Addresses: ${metrics.activeAddresses}
SOPR: ${metrics.sopr}
MVRV: ${metrics.mvrv}
Whale Balance Change: ${metrics.whaleBalanceChange}
`

  const summary = await generateChatCompletion(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    {
      model: 'gpt-4o-mini',
      temperature: 0.2,
      maxTokens: 500,
    },
  )

  const trimmed = summary.trim()

  /* 🔥 2️⃣ Redis 저장 (24시간) */
  await redis.set(cacheKey, trimmed, 'EX', 60 * 60 * 24)

  return trimmed
}