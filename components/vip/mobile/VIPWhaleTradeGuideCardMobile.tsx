//components/vip/mobile/VIPWhaleTradeGuideCardMobile.tsx

'use client'

import {
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  motion,
  useReducedMotion,
} from 'framer-motion'

import {
  useVIPMarketStore,
} from '@/lib/market/store/vipMarketStore'

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

  const whaleSampleValid =
    useVIPMarketStore(
      state => state.whaleSampleValid,
    )

  const isWhaleSampleInvalid =
    whaleSampleValid === false

  const shouldReduceMotion =
    useReducedMotion()

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
            className={
              isWhaleSampleInvalid
                ? 'ml-3 flex-shrink-0 text-right'
                : `font-semibold ${color}`
            }
          >
            {isWhaleSampleInvalid ? (
              <>
                <div className="inline-flex items-center justify-end gap-1.5 whitespace-nowrap text-[11px] font-semibold text-cyan-300">
                  <motion.span
                    className="h-1.5 w-1.5 rounded-full bg-cyan-400"
                    animate={
                      shouldReduceMotion
                        ? undefined
                        : {
                            opacity: [0.45, 1, 0.45],
                          }
                    }
                    transition={
                      shouldReduceMotion
                        ? undefined
                        : {
                            duration: 1.8,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }
                    }
                  />
                  <span>고래 체결 탐색 중</span>
                </div>

                <div className="mt-1 flex items-center justify-end gap-1.5 whitespace-nowrap text-[10px] font-medium text-cyan-400/60">
                  <span className="inline-flex items-center gap-0.5">
                    {[0, 1, 2, 3].map((index) => (
                      <motion.span
                        key={index}
                        className="h-1 w-2 rounded-sm bg-cyan-400"
                        style={{
                          opacity: shouldReduceMotion
                            ? index === 1
                              ? 0.8
                              : 0.2
                            : 0.2,
                        }}
                        animate={
                          shouldReduceMotion
                            ? undefined
                            : {
                                opacity: [0.2, 0.85, 0.2],
                              }
                        }
                        transition={
                          shouldReduceMotion
                            ? undefined
                            : {
                                duration: 1.6,
                                repeat: Infinity,
                                delay: index * 0.28,
                                ease: 'easeInOut',
                              }
                        }
                      />
                    ))}
                  </span>
                  <span>30초 롤링</span>
                </div>
              </>
            ) : direction}
          </div>

        </div>

        <div className="text-xs text-gray-400">
          Large Trade Participation (고래 참여 비율)
          {' '}
          {isWhaleSampleInvalid
            ? '—'
            : `${(ratio * 100).toFixed(1)}%`}
        </div>

        <div className="text-xs text-gray-500">
          Directional Pressure (방향 압력)
          {' '}
          {isWhaleSampleInvalid
            ? '—'
            : `${safeNet.toFixed(1)}%`}
        </div>

      </div>

    </VIPSignalCard>
  )
}
