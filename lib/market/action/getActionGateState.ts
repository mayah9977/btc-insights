/* =======================================================
  Action Gate (Final - Input 안정화)
======================================================= */

import type { ActionGateInput } from '@/lib/market/actionGate/actionGateInput'

export type ActionGateState = 'OBSERVE' | 'CAUTION' | 'IGNORE'

export interface ActionGateResult {
  state: ActionGateState
  score: number
  reasons: string[]
}

/* =======================================================
  🔥 EMA 기반 OI Ratio 스무딩
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
  🔥 Input 정규화 (핵심 추가)
  - oiDelta / oi 형태 자동 보정
======================================================= */

function normalizeOiRatio(
  oiDeltaRatio: number,
): number {
  if (!Number.isFinite(oiDeltaRatio)) return 0
  if (Math.abs(oiDeltaRatio) > 5) return 0
  return oiDeltaRatio
}

/* =======================================================
  🔒 Action Gate (Risk Mode Filter)
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

  /* 🔥 핵심 FIX (ratio 안정화) */
  const normalizedOiRatio =
    normalizeOiRatio(oiDeltaRatio)

  const smoothedOiRatio =
    getEmaOiRatio(normalizedOiRatio)

  const absOiRatio = Math.abs(smoothedOiRatio)

  /* =======================================================
    1️⃣ BLOCK MODE
  ======================================================= */

  if (whalePressure === 'EXTREME') {
    reasons.push('Whale EXTREME')
    return { state: 'IGNORE', score: 999, reasons }
  }

  if (
    absFunding >= 0.0025 &&
    absOiRatio >= 0.00012
  ) {
    reasons.push('Funding + OI extreme spike')
    return { state: 'IGNORE', score: 999, reasons }
  }

  /* =======================================================
    2️⃣ CAUTION MODE
  ======================================================= */

  let score = 0

  if (whalePressure === 'ELEVATED') {
    score += 2
    reasons.push('Whale elevated')
  }

  if (absFunding >= 0.0015) {
    score += 2
    reasons.push('Funding strong bias')
  } else if (absFunding >= 0.001) {
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
    3️⃣ OBSERVE
  ======================================================= */

  return { state: 'OBSERVE', score, reasons }
}
