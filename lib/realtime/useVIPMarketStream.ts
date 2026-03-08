'use client'

import { useEffect } from 'react'
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

export function useVIPMarketStream(symbol: string) {
  useEffect(() => {

    const safeSymbol = symbol?.toUpperCase()

    /* =========================
       OI
    ========================= */

    const unsubOI = sseManager.subscribe(
      SSE_EVENT.OI_TICK,
      (msg: any) => {
        if (msg.symbol?.toUpperCase() !== safeSymbol) return

        scheduleVIPMarketUpdate({
          oi: msg.openInterest ?? msg.oi ?? 0,
        })
      },
    )

    /* =========================
       VOLUME
    ========================= */

    const unsubVolume = sseManager.subscribe(
      SSE_EVENT.VOLUME_TICK,
      (msg: any) => {
        if (msg.symbol?.toUpperCase() !== safeSymbol) return

        scheduleVIPMarketUpdate({
          volume: msg.volume ?? 0,
        })
      },
    )

    /* =========================
       FUNDING
    ========================= */

    const unsubFunding = sseManager.subscribe(
      SSE_EVENT.FUNDING_RATE_TICK,
      (msg: any) => {
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
        if (msg.symbol?.toUpperCase() !== safeSymbol) return

        scheduleVIPMarketUpdate({
          whaleIntensity: msg.intensity ?? 0,
        })
      },
    )

    /* =========================
       WHALE NET PRESSURE
    ========================= */

    const unsubWhaleNet = sseManager.subscribe(
      SSE_EVENT.WHALE_NET_PRESSURE,
      (msg: any) => {
        if (msg.symbol?.toUpperCase() !== safeSymbol) return

        scheduleVIPMarketUpdate({
          whaleNet:
            msg.whaleNetRatio ??
            msg.whaleNetPressure ??
            0,
        })
      },
    )

    /* =========================
       FMAI
    ========================= */

    const unsubFMAI = subscribeVIPChannel(
      safeSymbol,
      (score, direction, ts) => {

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

        if (msg.symbol && msg.symbol.toUpperCase() !== safeSymbol) return

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

      unsubFMAI()
      unsubAbsorption()
      unsubSweep()

      unsubMarketState()
    }

  }, [symbol])
}
