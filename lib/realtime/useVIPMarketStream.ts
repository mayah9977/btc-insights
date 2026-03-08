'use client'

import { useEffect } from 'react'
import { useVIPMarketStore } from '@/lib/market/store/vipMarketStore'
import { sseManager } from '@/lib/realtime/sseConnectionManager'
import { SSE_EVENT } from '@/lib/realtime/types'

let buffer: any = {}
let scheduled = false

export function useVIPMarketStream(symbol: string) {

  const update = useVIPMarketStore((s) => s.update)

  useEffect(() => {

    function scheduleUpdate(data: any) {

      buffer = { ...buffer, ...data }

      if (scheduled) return

      scheduled = true

      setTimeout(() => {

        update(buffer)

        buffer = {}

        scheduled = false

      }, 250)

    }

    /* =========================
       OI
    ========================= */

    const unsubOI = sseManager.subscribe(
      SSE_EVENT.OI_TICK,
      (msg: any) => {

        if (msg.symbol !== symbol) return

        scheduleUpdate({
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

        if (msg.symbol !== symbol) return

        scheduleUpdate({
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

        if (msg.symbol !== symbol) return

        scheduleUpdate({
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

        if (msg.symbol !== symbol) return

        scheduleUpdate({
          whaleIntensity: msg.intensity ?? 0,
        })

      },
    )

    /* =========================
       WHALE NET
    ========================= */

    const unsubWhaleNet = sseManager.subscribe(
      SSE_EVENT.WHALE_NET_PRESSURE,
      (msg: any) => {

        if (msg.symbol !== symbol) return

        scheduleUpdate({
          whaleNet: msg.whaleNetRatio ?? msg.whaleNetPressure ?? 0,
        })

      },
    )

    /* =========================
       MARKET STATE
    ========================= */

    const unsubMarketState = sseManager.subscribe(
      'MARKET_STATE',
      (msg: any) => {

        scheduleUpdate({
          actionGateState: msg.actionGateState ?? 'OBSERVE',
        })

      },
    )

    return () => {

      unsubOI()
      unsubVolume()
      unsubFunding()
      unsubWhaleIntensity()
      unsubWhaleNet()
      unsubMarketState()

    }

  }, [symbol, update])
}
