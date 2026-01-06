/**
 * VIP 레벨별 추천 거래소 결정 로직
 * referrals 도메인 전용 (casino 의존성 없음)
 */

export type VIPLevel = 'FREE' | 'VIP1' | 'VIP2' | 'VIP3'

export function recommendExchangeByVip(vipLevel: VIPLevel) {
  switch (vipLevel) {
    case 'VIP3':
      return 'binance'
    case 'VIP2':
      return 'okx'
    case 'VIP1':
      return 'bybit'
    case 'FREE':
    default:
      return 'bitget'
  }
}
