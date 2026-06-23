// components/vip/mobile/VIPLiveStatusStripMobile.tsx

'use client'

import React, { useRef } from 'react'

import {
  motion,
  AnimatePresence,
} from 'framer-motion'

import { useRealtimeMarketComposite } from '@/lib/realtime/useRealtimeMarketComposite'
import { useVIPMarketStore } from '@/lib/market/store/vipMarketStore'

interface Props {
  symbol: string
}

export default function VIPLiveStatusStripMobile({
  symbol,
}: Props) {
  const {
    oi,
    volume,
    whaleIntensity,
  } = useRealtimeMarketComposite(symbol)

  const realtimeDelayed =
    useVIPMarketStore(
      (state) => state.realtimeDelayed,
    )

  const prevVolumeRef = useRef<number | null>(null)

  if (volume && volume !== 0) {
    prevVolumeRef.current = volume
  }

  const displayVolume =
    volume && volume !== 0
      ? volume
      : prevVolumeRef.current

  return (
    <div className="bg-zinc-900 border-b border-zinc-800">
      <AnimatePresence>
        {realtimeDelayed && (
          <motion.div
            initial={{
              opacity: 0,
              y: -8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: -8,
            }}
            transition={{
              duration: 0.22,
              ease: 'easeOut',
            }}
            className="
              border-b
              border-amber-400/40
              bg-gradient-to-r
              from-amber-500/20
              via-yellow-500/15
              to-orange-500/20
              px-4
              py-2
              text-center
              text-[11px]
              font-semibold
              leading-relaxed
              text-amber-200
              shadow-[0_0_20px_rgba(245,158,11,0.16)]
            "
          >
            실시간 데이터 지연 중 · 데이터를 다시 가져오는 중입니다.
            잠시만 기다려주세요.
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className="
          px-4
          py-2
          text-xs
          flex
          justify-between
          items-center
        "
      >
        <div className="flex flex-col">
          <span className="text-gray-400">OI</span>
          <span className="text-green-400 font-semibold">
            {oi?.toLocaleString() ?? '--'}
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-gray-400">VOL</span>
          <span className="text-green-400 font-semibold">
            {displayVolume != null
              ? displayVolume.toLocaleString()
              : '--'}
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-gray-400">WHALE</span>
          <span className="text-yellow-400 font-semibold">
            {whaleIntensity != null
              ? Math.round(whaleIntensity)
              : '--'}
          </span>
        </div>

        {realtimeDelayed && (
          <div className="rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-1 text-[10px] font-semibold text-amber-300">
            지연 중
          </div>
        )}
      </div>
    </div>
  )
}
