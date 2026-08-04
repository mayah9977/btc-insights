//components/vip/mobile/VIPWhaleMiniCharts.tsx

'use client'

import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
} from 'react'

import {
  motion,
  useReducedMotion,
} from 'framer-motion'

import {
  useVIPMarketStore,
} from '@/lib/market/store/vipMarketStore'

import {
  vipSound,
} from '@/lib/sound/vipSoundSystem'

import VIPSignalCard
  from './VIPSignalCard'

import {
  getMarketSnapshot,
} from '@/lib/market/engine/marketSnapshot'

export default function VIPWhaleMiniCharts() {

  const marketTick =
    useVIPMarketStore(
      (s) => s.ts,
    )

  const whaleSampleValid =
    useVIPMarketStore(
      (s) => s.whaleSampleValid,
    )

  const isWhaleSampleInvalid =
    whaleSampleValid === false

  const shouldReduceMotion =
    useReducedMotion()

  const snapshot =
    useMemo(() => {

      return getMarketSnapshot()

    }, [marketTick])

  const whaleIntensity =
    snapshot.whaleIntensity ?? 0

  const whaleNet =
    (
      snapshot.whaleNetRatio ?? 0
    ) * 100

  const prevIntensity =
    useRef<number>(0)

  const prevFlow =
    useRef<number>(0)

  const [
    intensityTrigger,
    setIntensityTrigger,
  ] = useState(0)

  const [
    flowTrigger,
    setFlowTrigger,
  ] = useState(0)

  const intensityPercent =
    Math.min(
      Math.max(
        whaleIntensity,
        0,
      ),
      100,
    )

  const flowPercent =
    Math.min(
      Math.abs(whaleNet),
      100,
    )

  const flowColor =
    whaleNet > 0
      ? 'bg-emerald-500'
      : whaleNet < 0
      ? 'bg-blue-500'
      : 'bg-gray-500'

  const directionLabel =
    whaleNet > 0
      ? 'LONG Pressure'
      : whaleNet < 0
      ? 'SHORT Pressure'
      : 'Neutral'

  useEffect(() => {

    if (
      prevIntensity.current < 60 &&
      intensityPercent >= 60
    ) {

      vipSound.play('signal')

      setIntensityTrigger(
        Date.now(),
      )
    }

    if (
      prevIntensity.current < 80 &&
      intensityPercent >= 80
    ) {

      vipSound.play('signal')

      setIntensityTrigger(
        Date.now(),
      )
    }

    prevIntensity.current =
      intensityPercent

  }, [intensityPercent])

  useEffect(() => {

    if (
      Math.abs(
        prevFlow.current,
      ) < 40 &&
      Math.abs(whaleNet) >= 40
    ) {

      vipSound.play('signal')

      setFlowTrigger(
        Date.now(),
      )
    }

    prevFlow.current =
      whaleNet

  }, [whaleNet])

  return (

    <div className="space-y-4">

      <VIPSignalCard
        trigger={intensityTrigger}
      >

        <div className="text-xs mx-4">

          <div
            className="
              flex
              justify-between
              text-zinc-400
              mb-1
            "
          >

            <span>
              Institutional Intervention Energy(고래 개입 강도)
            </span>

            <span>
              {intensityPercent.toFixed(1)}%
            </span>

          </div>

          <div className="h-2 bg-zinc-800 rounded overflow-hidden">

            <div
              className="
                h-full
                bg-yellow-400
                transition-all
                duration-300
              "
              style={{
                width:
                  `${intensityPercent}%`,
              }}
            />

          </div>

        </div>

      </VIPSignalCard>

      <VIPSignalCard
        trigger={flowTrigger}
      >

        <div className="text-xs mx-4">

          <div
            className="
              flex
              justify-between
              text-zinc-400
              mb-1
            "
          >

            {isWhaleSampleInvalid ? (
              <div className="min-w-0 pr-2">
                <div>
                  Directional Pressure(시장 방향 압력)
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] font-medium text-cyan-300">
                  <motion.span
                    className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-cyan-400"
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
                  <span className="text-cyan-400/60">
                    · 30초 롤링
                  </span>
                </div>
              </div>
            ) : (
              <span>
                Directional Pressure(시장 방향 압력)
                {' '}
                ({directionLabel})
              </span>
            )}

            <span>
              {isWhaleSampleInvalid
                ? '—'
                : `${flowPercent.toFixed(1)}%`}
            </span>

          </div>

          <div className="h-2 bg-zinc-800 rounded overflow-hidden">

            {isWhaleSampleInvalid ? (
              <div className="flex h-full items-center justify-center gap-1">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <motion.span
                    key={index}
                    className="h-1 w-3 rounded-sm bg-cyan-400"
                    style={{
                      opacity: shouldReduceMotion
                        ? index === 2
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
                            delay: index * 0.22,
                            ease: 'easeInOut',
                          }
                    }
                  />
                ))}
              </div>
            ) : (
              <div
                className={`
                  h-full
                  ${flowColor}
                  transition-all
                  duration-300
                `}
                style={{
                  width:
                    `${flowPercent}%`,
                }}
              />
            )}

          </div>

        </div>

      </VIPSignalCard>

    </div>
  )
}
