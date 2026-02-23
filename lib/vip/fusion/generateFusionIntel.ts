/* =========================================================
   Fusion Intelligence Engine (Institutional Weighted v5)
   - News + Onchain Institutional Weighting
   - External Weight Config Applied
   - Hedge-Fund Grade Structure
========================================================= */

import { generateChatCompletion } from '@/lib/openai/server'
import { redis } from '@/lib/redis/server'
import { sha256 } from '@/lib/utils/hash'

/* 🔥 가중치 설정 분리 파일 */
import {
  getAverageInstitutionWeight,
} from '@/lib/onchain/institutionWeights'

/* 🔥 버전 증가 */
const FUSION_ENGINE_VERSION = 'v5-weight-config'
const FUSION_MODEL = 'gpt-4o-mini'

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

/* =========================================================
   🔥 간단 Bias 점수 추출
========================================================= */

function extractBiasScore(text: string): number {
  const bearishKeywords = ['하락', '압력', '매도', '유입 증가', '위험 확대']
  const bullishKeywords = ['축적', '유출', '강세', '수요 증가', '공급 감소']

  let score = 0

  bearishKeywords.forEach(k => {
    if (text.includes(k)) score -= 1
  })

  bullishKeywords.forEach(k => {
    if (text.includes(k)) score += 1
  })

  if (score > 0) return 1
  if (score < 0) return -1
  return 0
}

/* ========================================================= */

export async function generateFusionIntel(
  input: FusionInput,
): Promise<FusionOutput> {

  const fusionKeySource = JSON.stringify(input)

  const cacheKey = `gpt:fusion:${FUSION_ENGINE_VERSION}:${FUSION_MODEL}:${sha256(
    fusionKeySource,
  )}`

  const cached = await redis.get(cacheKey)
  if (cached) {
    return JSON.parse(cached)
  }

  /* =========================================================
     🔥 1️⃣ Onchain 가중 점수 계산 (외부 설정 사용)
  ========================================================= */

  const biasScore = extractBiasScore(input.onchainSummary)

  const avgWeight = getAverageInstitutionWeight()

  const weightedScore = biasScore * avgWeight

  let computedRiskLevel: 'BULLISH' | 'NEUTRAL' | 'BEARISH' = 'NEUTRAL'
  if (weightedScore > 0.5) computedRiskLevel = 'BULLISH'
  if (weightedScore < -0.5) computedRiskLevel = 'BEARISH'

  /* =========================================================
     🔥 2️⃣ GPT 전략 생성
  ========================================================= */

  const systemPrompt = `
You are a hedge-fund level crypto macro strategist.

Fuse institutional research, macro news and positioning data
into an institutional-grade intelligence memo.

Output MUST be Korean.
STRICT JSON only.
Professional tone.
No trading advice.
`.trim()

  const userPrompt = `
[NEWS SUMMARY]
${input.newsSummary}

[STRUCTURAL]
${input.newsMidLongTerm}

[ONCHAIN SUMMARY]
${input.onchainSummary}

[WEIGHTED BIAS SCORE]
Computed Institutional Bias Score: ${weightedScore}
Derived Risk Level: ${computedRiskLevel}

[DERIVATIVES DATA]
Whale Intensity: ${input.whaleIntensity}
Funding Rate: ${input.fundingRate}
Open Interest: ${input.openInterest}
Sentiment Regime: ${input.sentimentRegime}

Return JSON:

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
        maxTokens: 900,
      },
    )

    const parsed = JSON.parse(content)

    const result: FusionOutput = {
      tacticalBias:
        parsed.tacticalBias ?? '중립적 포지셔닝',
      structuralOutlook:
        parsed.structuralOutlook ?? '구조적 추세 전환 신호 제한적',
      riskRegime:
        parsed.riskRegime ?? computedRiskLevel,
      positioningPressure:
        parsed.positioningPressure ?? '포지셔닝 압력 제한적',
    }

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
      structuralOutlook: '구조적 신호 불확실',
      riskRegime: computedRiskLevel,
      positioningPressure: '포지셔닝 불확실',
    }
  }
}
