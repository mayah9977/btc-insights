'use client'

import {
  useEffect,
  useRef,
  useState,
} from 'react'

import { vipSound }
  from '@/lib/sound/vipSoundSystem'

import VIPSignalCard
  from './VIPSignalCard'

type Props = {
  ratio: number
  net: number
}

export default function VIPWhaleTradeGuideCardMobile({
  ratio,
  net,
}: Props) {

  const prev =
    useRef<number>(0)

  const [trigger, setTrigger] =
    useState(0)

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

  const direction =
    net > 0
      ? 'LONG Pressure'
      : net < 0
      ? 'SHORT Pressure'
      : 'Neutral'

  const color =
    net > 0
      ? 'text-emerald-400'
      : net < 0
      ? 'text-blue-400'
      : 'text-gray-400'

  const safeNet =
    !isFinite(net)
      ? 0
      : Math.max(
          Math.min(net, 100),
          -100,
        )

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
            Trade Participation (시장 참여 비율)
          </div>

          <div
            className={`font-semibold ${color}`}
          >
            {direction}
          </div>

        </div>

        <div className="text-xs text-gray-400">
          Large Trade Participation (고래 참여 비율)
          {' '}
          {(ratio * 100).toFixed(1)}%
        </div>

        <div className="text-xs text-gray-500">
          Directional Pressure (방향 압력)
          {' '}
          {safeNet.toFixed(1)}%
        </div>

      </div>

    </VIPSignalCard>
  )
}
