'use client'

import { useEffect, useRef } from 'react'

import {
  scheduleVIPMarketUpdate,
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

/* =========================================================
   🔥 normalize (완화)
========================================================= */
const normalizeRatio = (v?: number): number => {
  if (v === undefined || v === null) return 0
  if (!Number.isFinite(v)) return 0

  // ✅ 완화 (100 → 1000)
  if (Math.abs(v) > 1000) return 0

  // % → ratio
  if (Math.abs(v) > 1) return v / 100

  return v
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

  /* 🔥 diff 체크 */
  const prevRef = useRef({
    ratio: 0,
    whaleNet: 0,
  })

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
    const safeSymbol = symbol?.toUpperCase()

    /* ========================= PRICE ========================= */
    const unsubPrice = sseManager.subscribe(
      SSE_EVENT.PRICE_TICK,
      (msg: any) => {
        if (!shouldUpdate('price')) return
        if (msg.symbol?.toUpperCase() !== safeSymbol) return

        scheduleVIPMarketUpdate({
          ...(msg.price !== undefined && { price: msg.price }),
          ...(msg.ts !== undefined && { ts: msg.ts }),
        })
      },
    )

    /* ========================= OI ========================= */
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
          ...(oi !== undefined && { oi }),
          ...(oiDelta !== undefined && { oiDelta }),
        })

        chartRealtimeBridge.update('liveStatus_desktop', {
          oi,
          oiDelta,
        })
      },
    )

    /* ========================= VOLUME ========================= */
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

    /* ========================= FUNDING ========================= */
    const unsubFunding = sseManager.subscribe(
      SSE_EVENT.FUNDING_RATE_TICK,
      (msg: any) => {
        if (!shouldUpdate('funding')) return
        if (msg.symbol?.toUpperCase() !== safeSymbol) return

        const fundingRate =
          msg.fundingRate !== undefined
            ? msg.fundingRate
            : undefined

        let fundingBias: any = 'NEUTRAL'

        if (fundingRate !== undefined) {
          if (fundingRate > 0.0015)
            fundingBias = 'LONG_HEAVY'
          else if (fundingRate < -0.0015)
            fundingBias = 'SHORT_HEAVY'
        }

        scheduleVIPMarketUpdate({
          ...(fundingRate !== undefined && {
            fundingRate,
          }),
          fundingBias,
        })
      },
    )

    /* ========================= WHALE INTENSITY ========================= */
    const unsubWhaleIntensity = sseManager.subscribe(
      SSE_EVENT.WHALE_INTENSITY,
      (msg: any) => {
        if (!shouldUpdate('whaleIntensity')) return
        if (msg.symbol?.toUpperCase() !== safeSymbol) return

        const intensity =
          msg.intensity !== undefined
            ? msg.intensity
            : undefined

        scheduleVIPMarketUpdate({
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

    /* ========================= WHALE NET ========================= */
    const unsubWhaleNet = sseManager.subscribe(
      SSE_EVENT.WHALE_NET_PRESSURE,
      (msg: any) => {
        if (!shouldUpdate('whaleNet')) return
        if (msg.symbol?.toUpperCase() !== safeSymbol) return

        const whaleNet = normalizeRatio(msg.whaleNetPressure)
        const whaleNetRatio = normalizeRatio(msg.whaleNetRatio)

        // ✅ threshold 완화
        if (
          Math.abs(whaleNet - prevRef.current.whaleNet) <
          0.0001
        )
          return

        prevRef.current.whaleNet = whaleNet

        scheduleVIPMarketUpdate({
          whaleNet,
          whaleNetRatio,
        })
      },
    )

    /* ========================= TRADE FLOW ========================= */
    const unsubTradeFlow = sseManager.subscribe(
      SSE_EVENT.WHALE_TRADE_FLOW,
      (msg: any) => {
        if (!shouldUpdate('whaleFlow')) return
        if (msg.symbol?.toUpperCase() !== safeSymbol) return

        const ratio = normalizeRatio(msg.ratio)

        // ✅ threshold 완화
        if (
          Math.abs(ratio - prevRef.current.ratio) <
          0.0001
        )
          return

        prevRef.current.ratio = ratio

        scheduleVIPMarketUpdate({
          whaleRatio: ratio,
        })

        const point = {
          ts: Date.now(),
          ratio,
          whaleVolume: msg.whaleVolume ?? 0,
          totalVolume: msg.totalVolume ?? 0,
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

    /* ========================= FMAI ========================= */
    const unsubFMAI = subscribeVIPChannel(
      safeSymbol,
      (score, direction, ts) => {
        if (!shouldUpdate('fmai')) return

        scheduleVIPMarketUpdate({
          ...(score !== undefined && { fmai: score }),
          ...(ts !== undefined && { ts }),
        })
      },
    )

    /* ========================= ABSORPTION ========================= */
    const unsubAbsorption = subscribeWhaleAbsorption(
      safeSymbol,
      (direction, strength, confidence, ts) => {
        if (!shouldUpdate('absorption')) return

        scheduleVIPMarketUpdate({
          ...(strength !== undefined && {
            absorption: strength,
          }),
          ...(ts !== undefined && { ts }),
        })
      },
    )

    /* ========================= SWEEP ========================= */
    const unsubSweep = subscribeLiquiditySweep(
      safeSymbol,
      (direction, strength, confidence, ts) => {
        if (!shouldUpdate('sweep')) return

        scheduleVIPMarketUpdate({
          ...(strength !== undefined && { sweep: strength }),
          ...(ts !== undefined && { ts }),
        })
      },
    )

    /* ========================= MARKET STATE ========================= */
    const unsubMarketState = sseManager.subscribe(
      'MARKET_STATE',
      (msg: any) => {
        if (!shouldUpdate('marketState')) return
        if (
          msg.symbol &&
          msg.symbol.toUpperCase() !== safeSymbol
        )
          return

        scheduleVIPMarketUpdate({
          actionGateState:
            msg.actionGateState ?? 'OBSERVE',
          ...(msg.macd && { macd: msg.macd }),
          ...(msg.ts !== undefined && { ts: msg.ts }),
        })
      },
    )

    /* ========================= FINAL DECISION ========================= */
    const unsubFinalDecision = sseManager.subscribe(
      'FINAL_DECISION',
      (msg: any) => {
        if (!shouldUpdate('finalDecision')) return
        if (
          msg.symbol &&
          msg.symbol.toUpperCase() !== safeSymbol
        )
          return

        scheduleVIPMarketUpdate({
          ...(msg.decision && { decision: msg.decision }),
          ...(msg.dominant && { dominant: msg.dominant }),
          ...(msg.confidence !== undefined && {
            confidence: msg.confidence,
          }),
          ...(msg.ts !== undefined && { ts: msg.ts }),
        })
      },
    )

    return () => {
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
