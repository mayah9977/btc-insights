'use client'

/**
 * ⛔ useRealtimeMarket — Disabled
 *
 * - 통합 Market 훅 제거
 * - 개별 훅(useRealtimePrice / useRealtimeVolume / useRealtimeOI) 사용 권장
 * - SSE 구독 ❌
 * - 상태 변경 ❌
 * - 리렌더 ❌
 *
 * 점진적 제거를 위한 안전 더미 훅
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
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      '[useRealtimeMarket] ⚠️ Disabled. Use individual hooks instead.',
    )
  }

  return DISABLED_STATE
}
