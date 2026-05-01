// lib/realtime/useRealtimeMarket.ts
'use client'

/**
 * ⛔ useRealtimeMarket — Disabled (Safe Stub)
 *
 * - 기존 구조 유지
 * - 모든 로그 제거 (console.warn 완전 제거)
 * - 반환 구조 유지
 * - 외부 사용 코드 영향 없음
 */

export type RealtimeMarketState = {
  price: number | null
  openInterest: number | null
  volume: number | null
  fundingRate: number | null
  lastUpdateTs: number | null
  connected: boolean
}

const DISABLED_STATE: RealtimeMarketState = {
  price: null,
  openInterest: null,
  volume: null,
  fundingRate: null,
  lastUpdateTs: null,
  connected: false,
}

export function useRealtimeMarket(
  _symbol: string = 'BTCUSDT',
): RealtimeMarketState {
  return DISABLED_STATE
}
