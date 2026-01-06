export type Exchange = 'Binance' | 'OKX' | 'Bybit' | 'Bitget'

/**
 * 실제 VIP 클릭 로그 기반 가중치 (Mock)
 * → 추후 DB / Analytics 연동
 */
const vipClickStats: Record<Exchange, number> = {
  Binance: 52,
  OKX: 31,
  Bybit: 12,
  Bitget: 5,
}

export function getTopVipChoice(): Exchange {
  return Object.entries(vipClickStats).sort(
    (a, b) => b[1] - a[1]
  )[0][0] as Exchange
}
