export type RealtimeAlertRule = {
  id: string
  symbol: string
  priceAbove?: number
  priceBelow?: number
  oiAbove?: number
  oiBelow?: number
}

export function matchRealtimeAlert(
  rule: RealtimeAlertRule,
  market: {
    price: number | null
    openInterest: number | null
  }
): boolean {
  if (!market.price || !market.openInterest) return false
  if (rule.symbol !== 'BTCUSDT') return false

  if (
    rule.priceAbove != null &&
    market.price <= rule.priceAbove
  )
    return false

  if (
    rule.priceBelow != null &&
    market.price >= rule.priceBelow
  )
    return false

  if (
    rule.oiAbove != null &&
    market.openInterest <= rule.oiAbove
  )
    return false

  if (
    rule.oiBelow != null &&
    market.openInterest >= rule.oiBelow
  )
    return false

  return true
}
