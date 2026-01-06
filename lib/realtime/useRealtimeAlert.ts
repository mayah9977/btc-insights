import { useMemo } from 'react'
import { useRealtimeMarket } from './useRealtimeMarket'

export type RealtimeAlertStatus =
  | 'IDLE'
  | 'PRICE_ONLY'
  | 'OI_ONLY'
  | 'READY'

export function useRealtimeAlert() {
  const market = useRealtimeMarket()

  const status = useMemo<RealtimeAlertStatus>(() => {
    if (market.price && market.openInterest) return 'READY'
    if (market.price) return 'PRICE_ONLY'
    if (market.openInterest) return 'OI_ONLY'
    return 'IDLE'
  }, [market.price, market.openInterest])

  return {
    ...market,
    status,
  }
}
