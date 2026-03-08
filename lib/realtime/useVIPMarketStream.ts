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
  subscribeFinalDecision
} from '@/lib/realtime/marketChannel'

/* =========================================================
   🔥 SSE Update Batching (Render Storm 방지)
========================================================= */

let pending: any = null
let scheduled = false

function scheduleUpdate(data: any) {

  pending = { ...(pending || {}), ...data }

  if (scheduled) return

  scheduled = true

  requestAnimationFrame(() => {

    useVIPMarketStore.getState().update(pending)

    pending = null
    scheduled = false

  })
}

/* ========================================================= */

export function useVIPMarketStream(symbol: string) {

  useEffect(() => {

    if (!symbol) return

    /* ================= FMAI ================= */

    const unsubVIP = subscribeVIPChannel(
      symbol,
      (score, direction, ts) => {

        scheduleUpdate({
          fmai: score,
          ts: ts ?? Date.now()
        })

      }
    )

    /* ================= Whale Absorption ================= */

    const unsubAbsorb = subscribeWhaleAbsorption(
      symbol,
      (direction, strength) => {

        scheduleUpdate({
          absorption: strength
        })

      }
    )

    /* ================= Liquidity Sweep ================= */

    const unsubSweep = subscribeLiquiditySweep(
      symbol,
      (direction, strength) => {

        scheduleUpdate({
          sweep: strength
        })

      }
    )

    /* ================= Whale Intensity ================= */

    const unsubWhaleIntensity = subscribeWhaleIntensity(
      symbol,
      (intensity, avg, trend, isSpike, ts) => {

        scheduleUpdate({
          whaleIntensity: intensity,
          ts: ts ?? Date.now()
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
          ts: ts ?? Date.now()
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

  }, [symbol])

}
