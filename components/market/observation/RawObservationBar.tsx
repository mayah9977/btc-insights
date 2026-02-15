'use client'

import { useEffect, useRef } from 'react'
import { useRealtimeOI } from '@/lib/realtime/useRealtimeOI'
import { useRealtimeVolume } from '@/lib/realtime/useRealtimeVolume'
import { useRealtimeMarket } from '@/lib/realtime/useRealtimeMarket'

/**
 * RawObservationBar
 *
 * ✅ Observation-only panel
 * ❌ No interpretation
 * ❌ No risk / direction / judgement language
 * ❌ No dependency on Action Gate state
 *
 * Visual role:
 * - Visually attached to ActionGate bottom
 * - Raw data layer (pre-interpretation)
 */

interface RawObservationBarProps {
  symbol: string
}

export function RawObservationBar({ symbol }: RawObservationBarProps) {
  const oiState = useRealtimeOI(symbol)
  const volumeState = useRealtimeVolume(symbol)
  const { fundingRate } = useRealtimeMarket(symbol)

  /** ------------------------------------------------
   * 🔹 Subtle number transition (CSS only)
   * - Detect value change → fade/slide once
   * - No semantic meaning added
   * ------------------------------------------------ */
  const oiRef = useRef<HTMLSpanElement | null>(null)
  const volRef = useRef<HTMLSpanElement | null>(null)
  const frRef = useRef<HTMLSpanElement | null>(null)

  useEffect(() => {
    ;[oiRef.current, volRef.current, frRef.current].forEach(el => {
      if (!el) return
      el.classList.remove('ag-num-animate')
      void el.offsetWidth // reflow
      el.classList.add('ag-num-animate')
    })
  }, [oiState.openInterest, volumeState.volume, fundingRate])

  return (
    <div className="relative">
      {/* ─────────────────────────────────────────────
          1️⃣ Visual cohesion layer (ActionGate bottom)
         ───────────────────────────────────────────── */}
      <div
        aria-hidden
        className="
          absolute top-0 left-0 right-0 h-px
          bg-gradient-to-r
          from-transparent
          via-white/15
          to-transparent
        "
      />

      {/* Observation content */}
      <div className="px-4 py-4 text-sm text-zinc-300">
        <div className="flex flex-wrap items-center gap-8">
          {/* Open Interest */}
          <div className="flex items-baseline gap-2">
            <span className="text-sm text-zinc-500">
              Open Interest (미결제약정)
            </span>
            <span
              ref={oiRef}
              className="
                text-base font-medium text-zinc-200
                transition-opacity transition-transform
                duration-300 ease-out
              "
            >
              {oiState.openInterest != null
                ? oiState.openInterest.toLocaleString()
                : '--'}
            </span>
          </div>

          {/* Volume */}
          <div className="flex items-baseline gap-2">
            <span className="text-sm text-zinc-500">
              Volume (거래량)
            </span>
            <span
              ref={volRef}
              className="
                text-base font-medium text-zinc-200
                transition-opacity transition-transform
                duration-300 ease-out
              "
            >
              {volumeState.volume != null
                ? volumeState.volume.toLocaleString()
                : '--'}
            </span>
          </div>

          {/* Funding Rate */}
          <div className="flex items-baseline gap-2">
            <span className="text-sm text-zinc-500">
              Funding rate (자금 조달율)
            </span>
            <span
              ref={frRef}
              className="
                text-base font-medium text-zinc-200
                transition-opacity transition-transform
                duration-300 ease-out
              "
            >
              {fundingRate != null && Number.isFinite(fundingRate)
                ? `${(fundingRate * 100).toFixed(4)}%`
                : '--'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
