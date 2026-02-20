/* =========================================================
   External On-chain AI Summarizer
   - OpenAI 기반
   - VIP 리포트 전용 요약 스타일
   - GPT Cache Applied (48h)
========================================================= */

import { generateChatCompletion } from '@/lib/openai/server'
import { redis } from '@/lib/redis/server'
import { sha256 } from '@/lib/utils/hash'
import type { ExternalOnchainRssItem } from './fetchOnchainRss'

if (typeof window !== 'undefined') {
  throw new Error('[Onchain Summarizer] server-only module')
}

export async function summarizeExternalOnchain(
  item: ExternalOnchainRssItem,
): Promise<string> {
  if (!item?.content) return ''

  /* 🔥 1️⃣ 캐시 키 생성 */
  const hashKey = sha256(item.title + item.content)
  const cacheKey = `gpt:onchain:rss:${hashKey}`

  const cached = await redis.get(cacheKey)
  if (cached) {
    return cached
  }

  const systemPrompt = `
You are a professional crypto on-chain research analyst.
Summarize the provided analysis into an institutional-grade daily intelligence note.

Rules:
- Maximum 6 bullet points
- Focus on BTC positioning
- Highlight short-term risk bias
- No marketing tone
- Use professional hedge-fund style language
- Output in Korean
`

  const userPrompt = `
Title: ${item.title}

Content:
${item.content}
`

  try {
    const summary = await generateChatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      {
        model: 'gpt-4o-mini',
        temperature: 0.3,
        maxTokens: 600,
      },
    )

    const trimmed = summary.trim()

    /* 🔥 2️⃣ Redis 저장 (48시간) */
    await redis.set(cacheKey, trimmed, 'EX', 60 * 60 * 48)

    return trimmed

  } catch (err) {
    console.error('[Onchain AI SUMMARY ERROR]', err)
    return ''
  }
}