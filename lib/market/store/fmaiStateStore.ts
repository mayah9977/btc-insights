/* =========================================================
   📊 FMAI State Store
   - symbol별 최신 FMAI 상태 저장
   - marketRealtimeConsumer → set
   - DecisionEngine → get
========================================================= */

import type { FMAIResult } from '@/lib/market/momentum/futuresMomentumAlignment'

/* ========================================================= */

interface FMAIStateEntry {
  value: FMAIResult
  ts: number
}

/* =========================================================
   🔒 글로벌 단일 인스턴스 보장
========================================================= */

const g = globalThis as any

if (!g.__FMAI_STATE_STORE__) {
  g.__FMAI_STATE_STORE__ = new Map<string, FMAIStateEntry>()
}

const store: Map<string, FMAIStateEntry> = g.__FMAI_STATE_STORE__

/* =========================================================
   ✅ setLastFMAI
========================================================= */

export function setLastFMAI(
  symbol: string,
  fmai: FMAIResult,
  ts: number = Date.now(),
) {
  if (!symbol || !fmai) return

  store.set(symbol.toUpperCase(), {
    value: fmai,
    ts,
  })
}

/* =========================================================
   ✅ getLastFMAI
========================================================= */

export function getLastFMAI(
  symbol: string,
): FMAIResult | null {

  const entry = store.get(symbol.toUpperCase())
  if (!entry) return null

  return entry.value
}

/* =========================================================
   🔎 디버그용 (선택 사용)
========================================================= */

export function getFMAIWithMeta(
  symbol: string,
): FMAIStateEntry | null {

  return store.get(symbol.toUpperCase()) ?? null
}

/* =========================================================
   🧹 초기화 (테스트/핫리로드 대응)
========================================================= */

export function clearFMAIState(symbol?: string) {
  if (!symbol) {
    store.clear()
    return
  }

  store.delete(symbol.toUpperCase())
}
