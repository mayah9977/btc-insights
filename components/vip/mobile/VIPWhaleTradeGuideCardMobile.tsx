'use client'

import { useEffect, useRef, useState } from 'react'
import { vipSound } from '@/lib/sound/vipSoundSystem'
import VIPSignalCard from './VIPSignalCard'

type Props = {
  ratio: number
  net: number
}

export default function VIPWhaleTradeGuideCardMobile({
  ratio,
  net,
}: Props) {

  const prev = useRef<number>(0)

  /* animation trigger */
  const [trigger, setTrigger] = useState(0)

  /* =========================
     🔊 Sound Trigger
  ========================= */

  useEffect(() => {

    if (
      Math.abs(net) >= 0.4 &&
      Math.abs(prev.current) < 0.4
    ) {
      vipSound.play('signal')
      setTrigger(Date.now())
    }

    prev.current = net

  }, [net])

  /* =========================
     Derived Values
  ========================= */

  const direction =
    net > 0
      ? 'Buy Pressure'
      : net < 0
      ? 'Sell Pressure'
      : 'Neutral'

  const color =
    net > 0
      ? 'text-emerald-400'
      : net < 0
      ? 'text-blue-400'
      : 'text-gray-400'

  /* =========================
     Render
  ========================= */

  return (

    <VIPSignalCard trigger={trigger}>

      <div
        className="
        mx-4
        rounded-xl
        border
        border-zinc-800
        bg-zinc-900
        p-4
        text-sm
        space-y-3
      "
      >

        <div className="flex justify-between">

          <div className="text-white font-semibold">
            Whale Trade Flow
          </div>

          <div className={`font-semibold ${color}`}>
            {direction}
          </div>

        </div>

        <div className="text-xs text-gray-400">
          Trade Ratio(기관급 고래체결 비중) {(ratio * 100).toFixed(1)}%
        </div>

        <div className="text-xs text-gray-500">
          Net Flow(큰 자금이 매수 우위인지 매도 우위인지 보여주는 값) {(net * 100).toFixed(1)}%
        </div>

      </div>

    </VIPSignalCard>

  )
}
