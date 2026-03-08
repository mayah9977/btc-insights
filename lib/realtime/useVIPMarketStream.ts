'use client'

import { useEffect } from 'react'
import { useVIPMarketStore } from '@/lib/market/store/vipMarketStore'

import {
  subscribeVIPChannel,
  subscribeWhaleAbsorption,
  subscribeLiquiditySweep,
  subscribeWhaleIntensity,
  subscribeWhaleNetPressure,
  subscribeMarketState,
  subscribeFinalDecision,
} from '@/lib/realtime/marketChannel'

/* =========================================================
   🔥 SSE Throttle Batch Layer
   - Render Storm 방지
   - Mobile safe
========================================================= */

let buffer: any = {}
let scheduled = false

const UPDATE_INTERVAL = 250 // ms (~4fps)

/* ========================================================= */

export function useVIPMarketStream(symbol: string) {
  const update = useVIPMarketStore((s) => s.update)

  useEffect(() => {
    if (!symbol) return

    function scheduleUpdate(data: any) {
      buffer = { ...buffer, ...data }

      if (scheduled) return

      scheduled = true

      setTimeout(() => {
        update(buffer)

        buffer = {}
        scheduled = false
      }, UPDATE_INTERVAL)
    }

    /* ================= FMAI ================= */

    const unsubVIP = subscribeVIPChannel(
      symbol,
      (score, direction, ts) => {
        scheduleUpdate({
          fmai: score,
          ts: ts ?? Date.now(),
        })
      }
    )

    /* ================= Whale Absorption ================= */

    const unsubAbsorb = subscribeWhaleAbsorption(
      symbol,
      (direction, strength) => {
        scheduleUpdate({
          absorption: strength,
        })
      }
    )

    /* ================= Liquidity Sweep ================= */

    const unsubSweep = subscribeLiquiditySweep(
      symbol,
      (direction, strength) => {
        scheduleUpdate({
          sweep: strength,
        })
      }
    )

    /* ================= Whale Intensity ================= */

    const unsubWhaleIntensity = subscribeWhaleIntensity(
      symbol,
      (intensity, avg, trend, isSpike, ts) => {
        scheduleUpdate({
          whaleIntensity: intensity,
          ts: ts ?? Date.now(),
        })
      }
    )

    /* ================= Whale Net Pressure ================= */

    const unsubWhaleNet = subscribeWhaleNetPressure(
      symbol,
      (
        whaleBuyVolume,
        whaleSellVolume,
        whaleNetPressure,
        whaleNetRatio,
        totalVolume,
        ts
      ) => {
        scheduleUpdate({
          whaleNet: whaleNetRatio,
          ts: ts ?? Date.now(),
        })
      }
    )

    /* ================= MARKET STATE ================= */

    const unsubMarketState = subscribeMarketState(
      symbol,
      (actionGateState, macd, ts) => {
        scheduleUpdate({
          actionGateState,
          macd,
          ts: ts ?? Date.now(),
        })
      }
    )

    /* ================= FINAL DECISION ================= */

    const unsubFinalDecision = subscribeFinalDecision(
      symbol,
      (decision, dominant, confidence, ts) => {
        scheduleUpdate({
          decision,
          dominant,
          confidence,
          ts: ts ?? Date.now(),
        })
      }
    )

    /* ================= CLEANUP ================= */

    return () => {
      unsubVIP()
      unsubAbsorb()
      unsubSweep()
      unsubWhaleIntensity()
      unsubWhaleNet()
      unsubMarketState()
      unsubFinalDecision()
    }
  }, [symbol, update])
}
