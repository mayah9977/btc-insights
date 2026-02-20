/* =========================================================
   Fusion Intelligence Engine (VIP Institutional Core)
   - News + Onchain + Derivatives + Whale
   - Tactical Bias Computation
   - GPT Cache Applied (6h)
   - Auto Cache Invalidation (Model/Version Based)
========================================================= */

import { generateChatCompletion } from '@/lib/openai/server'
import { redis } from '@/lib/redis/server'
import { sha256 } from '@/lib/utils/hash'

/* 🔥 운영용 버전 관리 */
const FUSION_ENGINE_VERSION = 'v3' // 프롬프트 변경 시 증가
const FUSION_MODEL = 'gpt-4o-mini' // 모델 변경 시 자동 무효화

export interface FusionInput {
  newsSummary: string
  newsMidLongTerm: string
  onchainSummary: string
  whaleIntensity: number
  fundingRate: number
  openInterest: number
  sentimentRegime: 'FEAR' | 'NEUTRAL' | 'GREED'
}

export interface FusionOutput {
  tacticalBias: string
  structuralOutlook: string
  riskRegime: string
  positioningPressure: string
}

export async function generateFusionIntel(
  input: FusionInput,
): Promise<FusionOutput> {

  /* =========================================================
     🔥 1️⃣ 캐시 키 생성 (모델 + 버전 포함)
  ========================================================= */

  const fusionKeySource = JSON.stringify(input)

  const cacheKey = `gpt:fusion:${FUSION_ENGINE_VERSION}:${FUSION_MODEL}:${sha256(
    fusionKeySource,
  )}`

  const cached = await redis.get(cacheKey)
  if (cached) {
    return JSON.parse(cached)
  }

  /* =========================================================
     🔥 2️⃣ 한국어 출력 강제
  ========================================================= */

  const systemPrompt = `
You are a hedge-fund level crypto macro strategist.

Your task:
Fuse news context, on-chain intelligence, whale activity,
derivatives positioning and sentiment into a single
institutional-grade intelligence memo.

Rules:
- Output MUST be written in Korean.
- Professional institutional tone.
- No marketing language.
- No trading advice.
- Output STRICT JSON only.
`.trim()

  const userPrompt = `
[NEWS SUMMARY]
${input.newsSummary}

[NEWS STRUCTURAL]
${input.newsMidLongTerm}

[ONCHAIN SUMMARY]
${input.onchainSummary}

[MARKET DATA]
Whale Intensity: ${input.whaleIntensity}
Funding Rate: ${input.fundingRate}
Open Interest: ${input.openInterest}
Sentiment Regime: ${input.sentimentRegime}

Return JSON format ONLY:

{
  "tacticalBias": "...",
  "structuralOutlook": "...",
  "riskRegime": "...",
  "positioningPressure": "..."
}
`.trim()

  try {
    const content = await generateChatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      {
        model: FUSION_MODEL,
        temperature: 0.25,
        maxTokens: 800,
      },
    )

    const parsed = JSON.parse(content)

    const result: FusionOutput = {
      tacticalBias:
        parsed.tacticalBias ?? '중립적 포지셔닝',
      structuralOutlook:
        parsed.structuralOutlook ?? '유동성 중심의 박스권 국면',
      riskRegime:
        parsed.riskRegime ?? '균형적 변동성 환경',
      positioningPressure:
        parsed.positioningPressure ?? '파생 포지셔닝 압력 제한적',
    }

    /* 🔥 3️⃣ Redis 저장 (6시간 캐시) */
    await redis.set(
      cacheKey,
      JSON.stringify(result),
      'EX',
      60 * 60 * 6,
    )

    return result

  } catch (err) {
    console.error('[Fusion ERROR]', err)

    return {
      tacticalBias: '중립적 포지셔닝',
      structuralOutlook: '구조적 전환 신호 부족',
      riskRegime: '변동성 압축 구간',
      positioningPressure: '포지셔닝 신호 불확실',
    }
  }
}