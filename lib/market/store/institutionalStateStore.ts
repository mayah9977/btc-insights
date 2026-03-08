/*
===========================================================
Institutional Accumulation State Store (SSOT)
-----------------------------------------------------------
기관 매집 상태 저장

사용 위치
- marketRealtimeConsumer
- SSE publish
- VIP Chart
- GuideCard
===========================================================
*/

export type InstitutionalDirection =
  | 'LONG'
  | 'SHORT'
  | 'NONE'

export type InstitutionalAccumulationState = {
  detected: boolean
  direction: InstitutionalDirection
  confidence: number
  ts: number
}

/* =======================================================
   내부 상태 저장
======================================================= */

const stateMap = new Map<
  string,
  InstitutionalAccumulationState
>()

/* =======================================================
   기본 상태
======================================================= */

function defaultState(): InstitutionalAccumulationState {
  return {
    detected: false,
    direction: 'NONE',
    confidence: 0,
    ts: 0,
  }
}

/* =======================================================
   상태 저장
======================================================= */

export function setInstitutionalState(
  symbol: string,
  next: InstitutionalAccumulationState,
) {
  const key = symbol.toUpperCase()

  stateMap.set(key, {
    detected: next.detected,
    direction: next.direction,
    confidence: next.confidence,
    ts: next.ts ?? Date.now(),
  })
}

/* =======================================================
   상태 조회
======================================================= */

export function getInstitutionalState(
  symbol: string,
): InstitutionalAccumulationState {

  const key = symbol.toUpperCase()

  return stateMap.get(key) ?? defaultState()
}

/* =======================================================
   마지막 방향 조회
======================================================= */

export function getInstitutionalDirection(
  symbol: string,
): InstitutionalDirection {

  const state = getInstitutionalState(symbol)

  return state.direction
}

/* =======================================================
   기관 매집 여부
======================================================= */

export function isInstitutionalAccumulating(
  symbol: string,
): boolean {

  const state = getInstitutionalState(symbol)

  return state.detected
}

/* =======================================================
   confidence 조회
======================================================= */

export function getInstitutionalConfidence(
  symbol: string,
): number {

  const state = getInstitutionalState(symbol)

  return state.confidence
}

/* =======================================================
   상태 초기화
======================================================= */

export function resetInstitutionalState(symbol: string) {

  const key = symbol.toUpperCase()

  stateMap.delete(key)
}
