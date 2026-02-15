/* =========================================================
   Market Context - Korean Generator (Final)
   - Input: English RSS headlines (3~5)
   - Output: Korean headlines + summary + mid/long-term interpretation
========================================================= */

import { generateChatCompletion } from '@/lib/openai/server'

interface HeadlineItem {
  source: string
  title: string
}

interface MarketContextResult {
  translatedHeadlines: string[]
  summary: string
  midLongTerm: string
}

export async function generateKoreanContext(
  headlines: HeadlineItem[]
): Promise<MarketContextResult> {
  if (!headlines?.length) {
    return {
      translatedHeadlines: [],
      summary: '최근 시장 관련 주요 뉴스가 감지되지 않았습니다.',
      midLongTerm:
        '단기 이벤트 부재 구간에서는 기술적 구조와 유동성 흐름이 주요 판단 기준이 됩니다.',
    }
  }

  const formattedHeadlines = headlines
    .map(h => `- ${h.source}: ${h.title}`)
    .join('\n')

  const systemPrompt = `
당신은 암호화폐 트레이딩 플랫폼의 분석 엔진입니다.
투자 조언이 아닌 시장 맥락 해석을 제공합니다.
과장 없이 전문적이고 구조적으로 작성하세요.
절대 "매수", "매도", "투자하세요" 같은 표현을 사용하지 마세요.
  `.trim()

  const userPrompt = `
다음 뉴스 헤드라인을 기반으로 한국어로 작성하세요.

[뉴스 헤드라인]
${formattedHeadlines}

출력 형식은 반드시 아래 JSON 구조로만 작성하세요:

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

  const content = await generateChatCompletion(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    {
      model: 'gpt-4o-mini',
      temperature: 0.4,
      maxTokens: 1000,
    }
  )

  try {
    const parsed = JSON.parse(content)

    return {
      translatedHeadlines: parsed.translatedHeadlines ?? [],
      summary: parsed.summary ?? '',
      midLongTerm: parsed.midLongTerm ?? '',
    }
  } catch (err) {
    console.error('[MarketContext] JSON parse failed:', err)

    return {
      translatedHeadlines: headlines.map(h => h.title),
      summary: content,
      midLongTerm:
        '최근 뉴스 흐름은 구조적 방향성보다는 포지션 재조정 가능성을 시사합니다.',
    }
  }
}
