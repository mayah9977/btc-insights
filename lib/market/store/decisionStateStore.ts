/* =========================================================
   🎯 Decision State SSOT (In-Memory)
   - DecisionEngine 최종 판단 저장
   - SSE Reconnect 대비
   - Symbol 단위 관리
   - 계산 로직 없음
========================================================= */

import type { FinalDecision } from '@/lib/market/actionGate/decisionEngine'

/* =========================================================
   내부 유틸
========================================================= */

function normalize(symbol: string) {
  return symbol?.toUpperCase()
}

/* =========================================================
   저장 구조
========================================================= */

export interface StoredDecision {
  decision: FinalDecision
  dominant?: 'LONG' | 'SHORT' | 'NONE'
  confidence?: number
  at: number
}

const decisionMap = new Map<string, StoredDecision>()

/* =========================================================
   Setter
========================================================= */

export function setLastDecision(
  symbol: string,
  decision: FinalDecision,
  options?: {
    dominant?: 'LONG' | 'SHORT' | 'NONE'
    confidence?: number
  },
) {
  const key = normalize(symbol)

  decisionMap.set(key, {
    decision,
    dominant: options?.dominant ?? 'NONE',
    confidence: options?.confidence ?? 0,
    at: Date.now(),
  })
}

/* =========================================================
   Getter
========================================================= */

export function getLastDecision(
  symbol: string,
): StoredDecision | null {
  return decisionMap.get(normalize(symbol)) ?? null
}

/* =========================================================
   Replay용 전체 조회 (선택적)
========================================================= */

export function getAllDecisions(): Record<
  string,
  StoredDecision
> {
  const result: Record<string, StoredDecision> = {}

  for (const [symbol, value] of decisionMap.entries()) {
    result[symbol] = value
  }

  return result
}

/* =========================================================
   초기화 (선택적)
========================================================= */

export function clearDecision(symbol: string) {
  decisionMap.delete(normalize(symbol))
}

export function clearAllDecisions() {
  decisionMap.clear()
}
