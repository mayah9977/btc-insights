/* =========================================================
   External On-chain AI Summarizer (Institutional v3)
   - Multi-Article Aggregated Summary
   - Hedge-Fund Grade Tone
   - GPT Cache Applied (48h)
   - fetchOnchainMultiList.ts 타입 연동
========================================================= */

import { generateChatCompletion } from '@/lib/openai/server'
import { redis } from '@/lib/redis/server'
import { sha256 } from '@/lib/utils/hash'
import type { ExternalOnchainRssItem } from './fetchOnchainMultiList'

if (typeof window !== 'undefined') {
  throw new Error('[Onchain Summarizer] server-only module')
}

/* =========================================================
   🔥 다중 기사 종합 요약
========================================================= */

export async function summarizeExternalOnchain(
  items: ExternalOnchainRssItem[],
): Promise<string> {

  if (!items || items.length === 0) return ''

  /* =========================================================
     🔥 1️⃣ 캐시 키 생성 (기사 배열 기반)
  ========================================================= */

  const combinedHashSource = items
    .map(i => `${i.source}|${i.title}|${i.pubDate}`)
    .join('||')

  const hashKey = sha256(combinedHashSource)
  const cacheKey = `gpt:onchain:rss:multi:${hashKey}`

  const cached = await redis.get(cacheKey)
  if (cached) return cached

  /* =========================================================
     🔥 2️⃣ 기사 통합 텍스트 구성
  ========================================================= */

  const combinedContent = items
    .map((item, index) => `
[Report ${index + 1}]
Source: ${item.source}
Date: ${item.pubDate}
Title: ${item.title}

${item.content}
`)
    .join('\n\n')

  /* =========================================================
     🔥 Institutional Prompt
  ========================================================= */

  const systemPrompt = `
You are a senior crypto on-chain strategist at a hedge fund.

Your task is to synthesize multiple institutional research reports
into a unified daily intelligence briefing.

Rules:
- Output in Korean
- Maximum 8 bullet points
- Focus on BTC positioning
- Identify short-term risk bias
- Mention structural implications if relevant
- No marketing tone
- No speculation beyond provided reports
- Professional institutional tone
`.trim()

  const userPrompt = `
다음은 최근 48시간 이내의 기관 온체인 리서치 보고서들입니다.

이들을 종합하여
"기관 보고서 ${items.length}건 통합 분석" 형태로 정리하세요.

${combinedContent}
`.trim()

  try {
    const summary = await generateChatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      {
        model: 'gpt-4o-mini',
        temperature: 0.25,
        maxTokens: 900,
      },
    )

    const trimmed = summary.trim()

    /* 🔥 3️⃣ Redis 캐시 저장 (48시간) */
    await redis.set(cacheKey, trimmed, 'EX', 60 * 60 * 48)

    return trimmed

  } catch (err) {
    console.error('[Onchain AI SUMMARY ERROR]', err)
    return ''
  }
}