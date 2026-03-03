import type { ActionGateInput } from '@/lib/market/actionGate/actionGateInput'

export type ActionGateState = 'OBSERVE' | 'CAUTION' | 'IGNORE'

export interface ActionGateResult {
  state: ActionGateState
  score: number
  reasons: string[]
}

/* =======================================================
   🔥 EMA 기반 OI Ratio 스무딩 (리스크 감지 전용)
======================================================= */

const EMA_ALPHA = 0.4
let emaOiRatio: number | null = null

function getEmaOiRatio(current: number) {
  if (emaOiRatio === null) {
    emaOiRatio = current
  } else {
    emaOiRatio =
      EMA_ALPHA * current +
      (1 - EMA_ALPHA) * emaOiRatio
  }

  return emaOiRatio
}

/* =======================================================
   🔒 Action Gate (Risk Mode Filter)
   역할:
   - 방향 결정 ❌
   - 리스크 차단 / 약화 모드 전환 전용
======================================================= */

export function getActionGateState(
  input: ActionGateInput,
): ActionGateResult {

  const {
    whalePressure,
    fundingRate,
    oiDeltaRatio,
  } = input

  const reasons: string[] = []
  const absFunding = Math.abs(fundingRate)

  const smoothedOiRatio = getEmaOiRatio(oiDeltaRatio)
  const absOiRatio = Math.abs(smoothedOiRatio)

  /* =======================================================
     1️⃣ 즉시 차단 조건 (BLOCK MODE)
  ======================================================= */

  if (whalePressure === 'EXTREME') {
    reasons.push('Whale EXTREME')
    return { state: 'IGNORE', score: 999, reasons }
  }

  if (absFunding >= 0.0025 && absOiRatio >= 0.00012) {
    reasons.push('Funding + OI extreme spike')
    return { state: 'IGNORE', score: 999, reasons }
  }

  /* =======================================================
     2️⃣ 약화 모드 (CAUTION MODE)
  ======================================================= */

  let score = 0

  if (whalePressure === 'ELEVATED') {
    score += 2
    reasons.push('Whale elevated')
  }

  if (absFunding >= 0.0015) {
    score += 2
    reasons.push('Funding strong bias')
  } else if (absFunding >= 0.0010) {
    score += 1
    reasons.push('Funding mild bias')
  }

  if (absOiRatio >= 0.00009) {
    score += 2
    reasons.push('OI strong spike')
  } else if (absOiRatio >= 0.00004) {
    score += 1
    reasons.push('OI mild spike')
  }

  if (score >= 3) {
    return { state: 'CAUTION', score, reasons }
  }

  /* =======================================================
     3️⃣ 정상 모드
  ======================================================= */

  return { state: 'OBSERVE', score, reasons }
}
