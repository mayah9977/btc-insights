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

/* ========================= Options ========================= */

type VIPMarketStreamOptions = {
  throttle?: number
}

/* ========================= Hook ========================= */

export function useVIPMarketStream(
  symbol: string,
  options?: VIPMarketStreamOptions,
) {

  const throttle = options?.throttle ?? 0

  /* =========================================================
     이벤트별 throttle 관리
  ========================================================= */

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
  })

  const shouldUpdate = (
    key: keyof typeof lastUpdateRef.current
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

    /* =========================
       OI
    ========================= */

    const unsubOI = sseManager.subscribe(
      SSE_EVENT.OI_TICK,
      (msg: any) => {

        if (!shouldUpdate('oi')) return
        if (msg.symbol?.toUpperCase() !== safeSymbol) return

        const oi = msg.openInterest ?? msg.oi ?? 0
        const oiDelta = msg.delta ?? 0

        scheduleVIPMarketUpdate({
          oi,
          oiDelta,
        })

        chartRealtimeBridge.update('liveStatus_desktop', {
          oi,
          oiDelta,
        })
      },
    )

    /* =========================
       VOLUME
    ========================= */

    const unsubVolume = sseManager.subscribe(
      SSE_EVENT.VOLUME_TICK,
      (msg: any) => {

        if (!shouldUpdate('volume')) return
        if (msg.symbol?.toUpperCase() !== safeSymbol) return

        const volume = msg.volume ?? 0

        scheduleVIPMarketUpdate({
          volume,
        })

        chartRealtimeBridge.update('liveStatus_desktop', {
          volume,
        })
      },
    )

    /* =========================
       FUNDING
    ========================= */

    const unsubFunding = sseManager.subscribe(
      SSE_EVENT.FUNDING_RATE_TICK,
      (msg: any) => {

        if (!shouldUpdate('funding')) return
        if (msg.symbol?.toUpperCase() !== safeSymbol) return

        scheduleVIPMarketUpdate({
          fundingRate: msg.fundingRate ?? 0,
        })
      },
    )

    /* =========================
       WHALE INTENSITY
    ========================= */

    const unsubWhaleIntensity = sseManager.subscribe(
      SSE_EVENT.WHALE_INTENSITY,
      (msg: any) => {

        if (!shouldUpdate('whaleIntensity')) return
        if (msg.symbol?.toUpperCase() !== safeSymbol) return

        const intensity = msg.intensity ?? 0

        scheduleVIPMarketUpdate({
          whaleIntensity: intensity,
        })

        chartRealtimeBridge.update(
          'whaleIntensity_desktop',
          {
            ts: Date.now(),
            value: intensity,
          },
        )

        chartRealtimeBridge.update(
          'liveStatus_desktop',
          {
            whaleIntensity: intensity,
            whaleSpike: intensity > 0.8,
          },
        )
      },
    )

    /* =========================
       WHALE NET PRESSURE
    ========================= */

    const unsubWhaleNet = sseManager.subscribe(
      SSE_EVENT.WHALE_NET_PRESSURE,
      (msg: any) => {

        if (!shouldUpdate('whaleNet')) return
        if (msg.symbol?.toUpperCase() !== safeSymbol) return

        scheduleVIPMarketUpdate({
          whaleNet: msg.whaleNetPressure ?? 0,
          whaleNetRatio: msg.whaleNetRatio ?? 0,
        })
      },
    )

    /* =========================
       Whale Trade Flow
    ========================= */

    const unsubTradeFlow = sseManager.subscribe(
      SSE_EVENT.WHALE_TRADE_FLOW,
      (msg: any) => {

        if (!shouldUpdate('whaleFlow')) return
        if (msg.symbol?.toUpperCase() !== safeSymbol) return

        const ratio = msg.ratio ?? 0

        scheduleVIPMarketUpdate({
          whaleRatio: ratio,
        })

        chartRealtimeBridge.update(
          'whaleTradeFlow_desktop',
          {
            ts: Date.now(),
            ratio,
            whaleVolume: msg.whaleVolume ?? 0,
            totalVolume: msg.totalVolume ?? 0,
          },
        )
      },
    )

    /* =========================
       FMAI
    ========================= */

    const unsubFMAI = subscribeVIPChannel(
      safeSymbol,
      (score, direction, ts) => {

        if (!shouldUpdate('fmai')) return

        scheduleVIPMarketUpdate({
          fmai: score,
          ts: ts ?? Date.now(),
        })
      },
    )

    /* =========================
       Whale Absorption
    ========================= */

    const unsubAbsorption = subscribeWhaleAbsorption(
      safeSymbol,
      (direction, strength, confidence, ts) => {

        if (!shouldUpdate('absorption')) return

        scheduleVIPMarketUpdate({
          absorption: strength,
          ts: ts ?? Date.now(),
        })
      },
    )

    /* =========================
       Liquidity Sweep
    ========================= */

    const unsubSweep = subscribeLiquiditySweep(
      safeSymbol,
      (direction, strength, confidence, ts) => {

        if (!shouldUpdate('sweep')) return

        scheduleVIPMarketUpdate({
          sweep: strength,
          ts: ts ?? Date.now(),
        })
      },
    )

    /* =========================
       MARKET STATE
    ========================= */

    const unsubMarketState = sseManager.subscribe(
      'MARKET_STATE',
      (msg: any) => {

        if (!shouldUpdate('marketState')) return
        if (msg.symbol && msg.symbol.toUpperCase() !== safeSymbol)
          return

        scheduleVIPMarketUpdate({
          actionGateState: msg.actionGateState ?? 'OBSERVE',
        })
      },
    )

    /* =========================
       CLEANUP
    ========================= */

    return () => {

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
    }

  }, [symbol, throttle])
}
