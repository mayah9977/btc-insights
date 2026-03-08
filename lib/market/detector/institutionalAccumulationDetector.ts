/*
===========================================================
Institutional Whale Accumulation Detector
-----------------------------------------------------------
목적
기관 매집 (Institutional Accumulation) 탐지

사용 데이터
- Whale Trade Ratio
- Whale Net Pressure
- Open Interest Delta
- FMAI Alignment
- Funding Bias

출력
- accumulationDetected
- direction
- confidence
===========================================================
*/

export type InstitutionalAccumulationDirection =
  | 'LONG'
  | 'SHORT'
  | 'NONE'

export type InstitutionalAccumulationResult = {
  detected: boolean
  direction: InstitutionalAccumulationDirection
  confidence: number
}

type Input = {
  whaleRatio: number
  whaleNetRatio: number
  oiDelta: number
  fmaiScore: number
  fundingBias?: number
}

/*
===========================================================
Threshold 정의
===========================================================
*/

const WHALE_RATIO_THRESHOLD = 0.35
const NET_PRESSURE_THRESHOLD = 0.05

/* 🔥 OI 완화 */
const OI_DELTA_THRESHOLD = -1

/* 🔥 수정된 값 (현실 데이터 기준) */
const FMAI_THRESHOLD = 0.10

/*
===========================================================
Utility
===========================================================
*/

function clamp(v: number) {
  return Math.max(0, Math.min(1, v))
}

/*
===========================================================
Confidence 계산
===========================================================
*/

function calculateConfidence(input: Input) {
  const {
    whaleRatio,
    whaleNetRatio,
    oiDelta,
    fmaiScore,
    fundingBias = 0,
  } = input

  const whaleScore = clamp(whaleRatio / 0.8)
  const netScore = clamp(Math.abs(whaleNetRatio) / 0.5)
  const oiScore = clamp(Math.abs(oiDelta) / 0.02)
  const fmai = clamp(Math.abs(fmaiScore))

  const fundingPenalty =
    fundingBias > 0.0005 ? 0.15 : 0

  const raw =
    whaleScore * 0.3 +
    netScore * 0.25 +
    oiScore * 0.2 +
    fmai * 0.25 -
    fundingPenalty

  return clamp(raw)
}

/*
===========================================================
Detector Engine
===========================================================
*/

export function detectInstitutionalAccumulation(
  input: Input,
): InstitutionalAccumulationResult {

  const {
    whaleRatio,
    whaleNetRatio,
    oiDelta,
    fmaiScore,
  } = input

  /* =========================
     기본 조건 검사
  ========================= */

  if (
    whaleRatio < WHALE_RATIO_THRESHOLD ||
    Math.abs(whaleNetRatio) < NET_PRESSURE_THRESHOLD ||
    Math.abs(fmaiScore) < FMAI_THRESHOLD
  ) {

    const result = {
      detected: false,
      direction: 'NONE' as InstitutionalAccumulationDirection,
      confidence: 0,
    }

    return result
  }

  /* =========================
     LONG Accumulation
  ========================= */

  if (
    whaleNetRatio > 0 &&
    oiDelta > OI_DELTA_THRESHOLD &&
    fmaiScore > FMAI_THRESHOLD
  ) {

    const confidence = calculateConfidence(input)

    const result = {
      detected: true,
      direction: 'LONG' as InstitutionalAccumulationDirection,
      confidence,
    }

    return result
  }

  /* =========================
     SHORT Accumulation
  ========================= */

  if (
    whaleNetRatio < 0 &&
    oiDelta > OI_DELTA_THRESHOLD &&
    fmaiScore < -FMAI_THRESHOLD
  ) {

    const confidence = calculateConfidence(input)

    const result = {
      detected: true,
      direction: 'SHORT' as InstitutionalAccumulationDirection,
      confidence,
    }

    return result
  }

  /* ========================= */

  const result = {
    detected: false,
    direction: 'NONE' as InstitutionalAccumulationDirection,
    confidence: 0,
  }

  return result
}
