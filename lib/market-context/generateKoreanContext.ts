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
    }
  }

  /* 🔥 2️⃣ 캐시 키 생성 */
  const headlineKeySource = headlines
    .map(h => `${h.source}:${h.title}`)
    .join('|')

  const cacheKey = `gpt:news:${sha256(headlineKeySource)}`
  const cached = await redis.get(cacheKey)

  if (cached) {
    return JSON.parse(cached)
  }

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
  const content = await generateChatCompletion(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    {
      model: 'gpt-4o-mini',
      temperature: 0.3,
      maxTokens: 900,
    }
  )

  /* 6️⃣ JSON 안정 파싱 */
  try {
    const jsonText = extractJson(content)

    if (!jsonText) {
      throw new Error('No JSON detected in GPT output')
    }

    const parsed = JSON.parse(jsonText)

    const result: MarketContextResult = {
      translatedHeadlines: parsed.translatedHeadlines ?? [],
      summary: parsed.summary ?? '',
      midLongTerm: parsed.midLongTerm ?? '',
    }

    /* 🔥 7️⃣ Redis 저장 (24시간) */
    await redis.set(cacheKey, JSON.stringify(result), 'EX', 60 * 60 * 24)

    return result

  } catch (err) {
    console.error('[MarketContext] JSON parse failed:', err)

    return {
      translatedHeadlines: headlines.map(h => h.title),
      summary:
        '현재 글로벌 뉴스 흐름은 단기 변동성 확대 가능성을 시사하며, 구조적 추세 전환 신호는 제한적입니다.',
      midLongTerm:
        '중장기적으로는 거시 환경과 유동성 조건이 방향성을 결정할 핵심 변수로 작용할 전망입니다.',
    }
  }
}
