// lib/market-context/generateKoreanContext.ts

/* =========================================================
   Market Context - Korean Generator (Stable + GPT Cache)
========================================================= */

import { generateChatCompletion } from '@/lib/openai/server'
import { redis } from '@/lib/redis/server'
import { sha256 } from '@/lib/utils/hash'

interface HeadlineItem {
  source: string
  title: string
}

interface MarketContextResult {
  translatedHeadlines: string[]
  summary: string
  midLongTerm: string
  fallbackUsed?: boolean
}

const GPT_RETRY_COUNT = 3
const GPT_RETRY_BACKOFF_MS = 1500

function sleep(ms: number) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

function buildFallbackContext(
  headlines: HeadlineItem[]
): MarketContextResult {
  const translatedHeadlines = headlines
    .slice(0, 5)
    .map(h => h.title)

  const headlineText = translatedHeadlines
    .slice(0, 3)
    .join(', ')

  return {
    translatedHeadlines,
    summary:
      headlineText.length > 0
        ? `오늘 주요 암호화폐 뉴스는 ${headlineText} 등의 흐름을 중심으로 형성되고 있습니다. OpenAI 분석 호출이 일시적으로 실패했기 때문에, 현재 요약은 RSS 헤드라인 기반의 안전한 기본 해석으로 제공됩니다. 단기적으로는 뉴스 민감도와 변동성 확대 가능성을 함께 확인할 필요가 있습니다.`
        : '오늘 주요 암호화폐 뉴스 흐름은 단기 변동성 확대 가능성을 시사하고 있습니다. OpenAI 분석 호출이 일시적으로 실패했기 때문에, 현재 요약은 RSS 기반의 안전한 기본 해석으로 제공됩니다.',
    midLongTerm:
      '중장기적으로는 거시 유동성, 비트코인 현물 ETF 수급, 주요 거래소 및 규제 관련 뉴스가 시장 방향성 판단의 핵심 변수로 작용할 수 있습니다. 현재 단계에서는 단일 뉴스보다 여러 헤드라인이 공통적으로 가리키는 위험 선호 변화와 자금 흐름을 함께 보는 것이 중요합니다. 시스템은 다음 cron 실행에서 GPT 기반 정밀 요약을 다시 시도합니다.',
    fallbackUsed: true,
  }
}

/* =========================================================
   JSON 추출 유틸 (GPT 안정 파싱용)
========================================================= */

function extractJson(text: string): string | null {
  const match = text.match(/\{[\s\S]*\}/)
  return match ? match[0] : null
}

/* =========================================================
   Main Generator
========================================================= */

export async function generateKoreanContext(
  headlines: HeadlineItem[]
): Promise<MarketContextResult> {

  /* 1️⃣ 헤드라인 없음 */
  if (!headlines?.length) {
    return {
      translatedHeadlines: [],
      summary: '',
      midLongTerm: '',
      fallbackUsed: false,
    }
  }

  /* 🔥 2️⃣ 캐시 키 생성 */
  const headlineKeySource = headlines
    .map(h => `${h.source}:${h.title}`)
    .join('|')

  const cacheKey = `gpt:news:${sha256(headlineKeySource)}`
  const cached = await redis.get(cacheKey)

  if (cached) {
    console.log('[MARKET_CONTEXT_GPT_CACHE_HIT]', {
      ts: Date.now(),
      cacheKey,
      headlineCount: headlines.length,
    })

    return {
      ...JSON.parse(cached),
      fallbackUsed: false,
    }
  }

  console.log('[MARKET_CONTEXT_GPT_CACHE_MISS]', {
    ts: Date.now(),
    cacheKey,
    headlineCount: headlines.length,
  })

  /* 3️⃣ 포맷팅 */
  const formattedHeadlines = headlines
    .map(h => `- ${h.source}: ${h.title}`)
    .join('\n')

  /* 4️⃣ 프롬프트 */
  const systemPrompt = `
당신은 암호화폐 트레이딩 플랫폼의 분석 엔진입니다.
투자 조언이 아닌 시장 맥락 해석을 제공합니다.
과장 없이 전문적이고 구조적으로 작성하세요.
절대 "매수", "매도", "투자하세요" 같은 표현을 사용하지 마세요.
출력은 반드시 JSON만 반환하세요.
`.trim()

  const userPrompt = `
다음 뉴스 헤드라인을 기반으로 한국어로 작성하세요.

[뉴스 헤드라인]
${formattedHeadlines}

반드시 아래 JSON 구조로만 응답하세요:

{
  "translatedHeadlines": ["...", "...", "..."],
  "summary": "...",
  "midLongTerm": "..."
}

요구사항:
- translatedHeadlines는 자연스러운 한국어 재작성
- summary 3~4문장
- midLongTerm 3~4문장
- 중립적이고 구조적 해석 중심
`.trim()

  /* 5️⃣ GPT 호출 */
  let content: string | null = null
  let lastError: unknown = null

  for (
    let attempt = 1;
    attempt <= GPT_RETRY_COUNT;
    attempt += 1
  ) {
    try {
      content = await generateChatCompletion(
        [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        {
          model: 'gpt-4o-mini',
          temperature: 0.3,
          maxTokens: 900,
        }
      )

      break
    } catch (error) {
      lastError = error

      console.warn('[MARKET_CONTEXT_GPT_RETRY]', {
        ts: Date.now(),
        attempt,
        maxAttempts: GPT_RETRY_COUNT,
        error:
          error instanceof Error
            ? error.message
            : String(error),
      })

      if (attempt < GPT_RETRY_COUNT) {
        await sleep(
          GPT_RETRY_BACKOFF_MS * attempt
        )
      }
    }
  }

  if (!content) {
    console.error('[MARKET_CONTEXT_GPT_FAILED_USING_FALLBACK]', {
      ts: Date.now(),
      reason: 'GPT_CALL_FAILED',
      error:
        lastError instanceof Error
          ? lastError.message
          : String(lastError),
      headlineCount: headlines.length,
    })

    return buildFallbackContext(headlines)
  }

  /* 6️⃣ JSON 안정 파싱 */
  try {
    const jsonText = extractJson(content)

    if (!jsonText) {
      throw new Error('No JSON detected in GPT output')
    }

    const parsed = JSON.parse(jsonText)

    const result: MarketContextResult = {
      translatedHeadlines:
        parsed.translatedHeadlines ?? [],
      summary: parsed.summary ?? '',
      midLongTerm:
        parsed.midLongTerm ?? '',
      fallbackUsed: false,
    }

    /* 🔥 7️⃣ Redis 저장 (24시간) */
    await redis.set(
      cacheKey,
      JSON.stringify(result),
      'EX',
      60 * 60 * 24
    )

    return result

  } catch (err) {
    console.error('[MarketContext] JSON parse failed:', err)

    console.error('[MARKET_CONTEXT_GPT_FAILED_USING_FALLBACK]', {
      ts: Date.now(),
      reason: 'GPT_JSON_PARSE_FAILED',
      headlineCount: headlines.length,
    })

    return buildFallbackContext(headlines)
  }
}
