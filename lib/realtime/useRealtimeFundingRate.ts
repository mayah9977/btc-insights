'use client'

import { useVIPMarketStore } from '@/lib/market/store/vipMarketStore'

type FundingState = {
  fundingRate: number | null
  connected: boolean
  lastUpdatedAt: number | null
}

export function useRealtimeFundingRate(symbol: string): FundingState {

  const fundingRate = useVIPMarketStore((s) => s.fundingRate)
  const ts = useVIPMarketStore((s) => s.ts)

  return {
    fundingRate: fundingRate ?? null,
    connected: fundingRate !== undefined,
    lastUpdatedAt: ts ?? null,
  }
}
