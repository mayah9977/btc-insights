// lib/realtime/useVIPMarketStream.ts

'use client'

import { useEffect, useRef } from 'react'

import {
  scheduleVIPMarketUpdate,
  useVIPMarketStore,
} from '@/lib/market/store/vipMarketStore'

import { sseManager } from '@/lib/realtime/sseConnectionManager'
import { SSE_EVENT } from '@/lib/realtime/types'

import {
  subscribeVIPChannel,
  subscribeWhaleAbsorption,
  subscribeLiquiditySweep,
} from '@/lib/realtime/marketChannel'

import { chartRealtimeBridge } from '@/lib/chart/chartRealtimeBridge'
import { chartController } from '@/lib/chart/chartController'

type VIPMarketStreamOptions = {
  throttle?: number
}

type FundingBias =
  | 'LONG_HEAVY'
  | 'SHORT_HEAVY'
  | 'NEUTRAL'

type RealtimeFallbackPayload = {
  ok?: boolean
  source?: string
  symbol?: string
  ts?: number
  data?: {
    price?: number
    oi?: number
    fundingRate?: number
  }
  error?: string
}

const FALLBACK_HYDRATE_INTERVAL_MS = 30000
const FUNDING_BIAS_THRESHOLD = 0.0015

function normalizeWhaleIntensityScale(
  value: unknown,
): number | undefined {
  const n = Number(value)

  if (!Number.isFinite(n)) return undefined

  if (n <= 1) {
    return Math.max(0, Math.min(100, n * 100))
  }

  return Math.max(0, Math.min(100, n))
}

function resolveFundingBias(
  fundingRate: number | undefined,
): FundingBias {
  if (fundingRate === undefined) {
    return 'NEUTRAL'
  }

  if (fundingRate > FUNDING_BIAS_THRESHOLD) {
    return 'LONG_HEAVY'
  }

  if (fundingRate < -FUNDING_BIAS_THRESHOLD) {
    return 'SHORT_HEAVY'
  }

  return 'NEUTRAL'
}

/**
 * Primary market-feed events에서만 사용합니다.
 *
 * 적용 대상:
 * PRICE / OI / VOLUME / FUNDING / WHALE
 *
 * FMAI / ABSORPTION / SWEEP / MARKET_STATE /
 * FINAL_DECISION 같은 derived event에는 붙이지 않습니다.
 */
function realtimeAlivePatch() {
  return {
    lastRealtimeTs: Date.now(),
    realtimeDelayed: false,
  }
}

export function useVIPMarketStream(
  symbol: string,
  options?: VIPMarketStreamOptions,
) {
  const throttle = options?.throttle ?? 0

  const lastUpdateRef = useRef({
    oi: 0,
    volume: 0,
    funding: 0,
    whaleIntensity: 0,
    whaleNet: 0,
    whaleFlow: 0,
    fmai: 0,
    absorption: 0,
    sweep: 0,
    marketState: 0,
    finalDecision: 0,
    price: 0,
  })

  const prevVolumeRef = useRef(0)
  const fallbackInFlightRef = useRef(false)
  const lastFallbackHydrateRef = useRef(0)

  const shouldUpdate = (
    key: keyof typeof lastUpdateRef.current,
  ) => {
    if (!throttle) return true

    const now = Date.now()

    if (now - lastUpdateRef.current[key] < throttle) {
      return false
    }

    lastUpdateRef.current[key] = now
    return true
  }

  useEffect(() => {
    const safeSymbol =
      symbol?.toUpperCase() || 'BTCUSDT'

    const hydrateRealtimeFallback = async () => {
      const now = Date.now()

      if (fallbackInFlightRef.current) {
        return
      }

      if (
        now - lastFallbackHydrateRef.current <
        FALLBACK_HYDRATE_INTERVAL_MS
      ) {
        return
      }

      fallbackInFlightRef.current = true
      lastFallbackHydrateRef.current = now

      try {
        const res = await fetch(
          `/api/market/realtime-fallback?symbol=${safeSymbol}`,
          { cache: 'no-store' },
        )

        if (!res.ok) {
          return
        }

        const json =
          (await res.json()) as RealtimeFallbackPayload

        const data = json?.data ?? {}

        const price = Number(data.price)
        const oi = Number(data.oi)
        const fundingRate = Number(data.fundingRate)

        const safeFundingRate =
          Number.isFinite(fundingRate)
            ? fundingRate
            : undefined

        const fundingBias =
          safeFundingRate !== undefined
            ? resolveFundingBias(safeFundingRate)
            : undefined

        scheduleVIPMarketUpdate({
          ...(Number.isFinite(price) && { price }),
          ...(Number.isFinite(oi) && { oi }),
          ...(safeFundingRate !== undefined && {
            fundingRate: safeFundingRate,
          }),
          ...(fundingBias !== undefined && {
            fundingBias,
          }),
        })
      } catch {
      } finally {
        fallbackInFlightRef.current = false
      }
    }

    const staleTimer = window.setInterval(() => {
      const state = useVIPMarketStore.getState()

      if (
        state.lastRealtimeTs > 0 &&
        Date.now() - state.lastRealtimeTs > 15000
      ) {
        state.markRealtimeDelayed(true)
        void hydrateRealtimeFallback()
      }
    }, 5000)

    const unsubPrice = sseManager.subscribe(
      SSE_EVENT.PRICE_TICK,
      (msg: any) => {
        if (!shouldUpdate('price')) return
        if (msg.symbol?.toUpperCase() !== safeSymbol) return

        scheduleVIPMarketUpdate({
          ...realtimeAlivePatch(),
          ...(msg.price !== undefined && {
            price: msg.price,
          }),
        })
      },
    )

    const unsubOI = sseManager.subscribe(
      SSE_EVENT.OI_TICK,
      (msg: any) => {
        if (!shouldUpdate('oi')) return
        if (msg.symbol?.toUpperCase() !== safeSymbol) return

        const oi =
          msg.openInterest !== undefined
            ? msg.openInterest
            : msg.oi

        const oiDelta =
          msg.delta !== undefined ? msg.delta : undefined

        scheduleVIPMarketUpdate({
          ...realtimeAlivePatch(),
          ...(oi !== undefined && { oi }),
          ...(oiDelta !== undefined && { oiDelta }),
        })

        chartRealtimeBridge.update('liveStatus_desktop', {
          oi,
          oiDelta,
        })
      },
    )

    const unsubVolume = sseManager.subscribe(
      SSE_EVENT.VOLUME_TICK,
      (msg: any) => {
        if (!shouldUpdate('volume')) return
        if (msg.symbol?.toUpperCase() !== safeSymbol) return

        const volume =
          msg.volume !== undefined ? msg.volume : undefined

        let volumeRatio: number | undefined = undefined

        if (volume !== undefined) {
          volumeRatio =
            prevVolumeRef.current > 0
              ? (volume - prevVolumeRef.current) /
                  prevVolumeRef.current +
                1
              : undefined

          prevVolumeRef.current = volume
        }

        scheduleVIPMarketUpdate({
          ...realtimeAlivePatch(),
          ...(volume !== undefined && { volume }),
          ...(volumeRatio !== undefined && {
            volumeRatio,
          }),
        })

        chartRealtimeBridge.update('liveStatus_desktop', {
          volume,
        })
      },
    )

    const unsubFunding = sseManager.subscribe(
      SSE_EVENT.FUNDING_RATE_TICK,
      (msg: any) => {
        if (!shouldUpdate('funding')) return
        if (msg.symbol?.toUpperCase() !== safeSymbol) return

        const fundingRate =
          msg.fundingRate !== undefined
            ? msg.fundingRate
            : undefined

        const fundingBias =
          resolveFundingBias(fundingRate)

        scheduleVIPMarketUpdate({
          ...realtimeAlivePatch(),
          ...(fundingRate !== undefined && {
            fundingRate,
          }),
          fundingBias,
        })
      },
    )

    const unsubWhaleIntensity = sseManager.subscribe(
      SSE_EVENT.WHALE_INTENSITY,
      (msg: any) => {
        if (!shouldUpdate('whaleIntensity')) return
        if (msg.symbol?.toUpperCase() !== safeSymbol) return

        const intensity =
          msg.intensity !== undefined
            ? normalizeWhaleIntensityScale(msg.intensity)
            : undefined

        scheduleVIPMarketUpdate({
          ...realtimeAlivePatch(),
          ...(intensity !== undefined && {
            whaleIntensity: intensity,
          }),
        })

        chartRealtimeBridge.update(
          'liveStatus_desktop',
          { whaleIntensity: intensity },
        )
      },
    )

    const unsubWhaleNet = sseManager.subscribe(
      SSE_EVENT.WHALE_NET_PRESSURE,
      (msg: any) => {
        if (!shouldUpdate('whaleNet')) return
        if (msg.symbol?.toUpperCase() !== safeSymbol) return

        const whaleNet =
          msg.whaleNetPressure !== undefined
            ? msg.whaleNetPressure
            : undefined

        const whaleNetRatio =
          msg.whaleNetRatio !== undefined
            ? msg.whaleNetRatio
            : undefined

        scheduleVIPMarketUpdate({
          ...realtimeAlivePatch(),
          ...(whaleNet !== undefined && { whaleNet }),
          ...(whaleNetRatio !== undefined && {
            whaleNetRatio,
          }),
        })
      },
    )

    const unsubTradeFlow = sseManager.subscribe(
      SSE_EVENT.WHALE_TRADE_FLOW,
      (msg: any) => {
        if (!shouldUpdate('whaleFlow')) return
        if (msg.symbol?.toUpperCase() !== safeSymbol) return

        const ratio =
          msg.ratio !== undefined ? msg.ratio : undefined

        if (ratio !== undefined) {
          scheduleVIPMarketUpdate({
            ...realtimeAlivePatch(),
            whaleRatio: ratio,
          })
        } else {
          scheduleVIPMarketUpdate({
            ...realtimeAlivePatch(),
          })
        }

        const point = {
          ts: Date.now(),
          ratio,
          whaleVolume: msg.whaleVolume,
          totalVolume: msg.totalVolume,
        }

        chartRealtimeBridge.update(
          'whaleTradeFlow_desktop',
          point,
        )

        chartController.push(
          'whaleTradeFlow_desktop',
          point,
        )
      },
    )

    const unsubFMAI = subscribeVIPChannel(
      safeSymbol,
      (score) => {
        if (!shouldUpdate('fmai')) return

        scheduleVIPMarketUpdate({
          ...(score !== undefined && { fmai: score }),
        })
      },
    )

    const unsubAbsorption = subscribeWhaleAbsorption(
      safeSymbol,
      (_, strength) => {
        if (!shouldUpdate('absorption')) return

        scheduleVIPMarketUpdate({
          ...(strength !== undefined && {
            absorption: strength,
          }),
        })
      },
    )

    const unsubSweep = subscribeLiquiditySweep(
      safeSymbol,
      (_, strength) => {
        if (!shouldUpdate('sweep')) return

        scheduleVIPMarketUpdate({
          ...(strength !== undefined && { sweep: strength }),
        })
      },
    )

    const unsubMarketState = sseManager.subscribe(
      'MARKET_STATE',
      (msg: any) => {
        if (!shouldUpdate('marketState')) return
        if (
          msg.symbol &&
          msg.symbol.toUpperCase() !== safeSymbol
        ) {
          return
        }

        const hasActionGateState =
          msg.actionGateState !== undefined

        scheduleVIPMarketUpdate({
          ...(hasActionGateState && {
            actionGateState: msg.actionGateState,
          }),
          ...(msg.macd && { macd: msg.macd }),
        })
      },
    )

    const unsubFinalDecision = sseManager.subscribe(
      'FINAL_DECISION',
      (msg: any) => {
        if (!shouldUpdate('finalDecision')) return
        if (
          msg.symbol &&
          msg.symbol.toUpperCase() !== safeSymbol
        ) {
          return
        }

        scheduleVIPMarketUpdate({
          ...(msg.decision && { decision: msg.decision }),
          ...(msg.dominant && { dominant: msg.dominant }),
          ...(msg.confidence !== undefined && {
            confidence: msg.confidence,
          }),
        })
      },
    )

    return () => {
      window.clearInterval(staleTimer)

      unsubPrice()
      unsubOI()
      unsubVolume()
      unsubFunding()

      unsubWhaleIntensity()
      unsubWhaleNet()
      unsubTradeFlow()

      unsubFMAI()
      unsubAbsorption()
      unsubSweep()

      unsubMarketState()
      unsubFinalDecision()
    }
  }, [symbol, throttle])
}
