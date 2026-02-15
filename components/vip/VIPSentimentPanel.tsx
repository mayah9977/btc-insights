'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { subscribeSentiment } from '@/lib/realtime/marketChannel'
import { VIPSentimentFlashOverlay } from './VIPSentimentFlashOverlay'

type Props = {
  symbol?: string
}

function getLabel(v: number) {
  if (v < 25) return 'Extreme Fear'
  if (v < 45) return 'Fear'
  if (v < 60) return 'Neutral'
  if (v < 75) return 'Greed'
  return 'Extreme Greed'
}

function getColor(v: number) {
  if (v < 25) return '#dc2626'
  if (v < 45) return '#f97316'
  if (v < 60) return '#eab308'
  if (v < 75) return '#22c55e'
  return '#10b981'
}

export default function VIPSentimentPanel({
  symbol = 'BTCUSDT',
}: Props) {
  const [value, setValue] = useState(50)
  const [glow, setGlow] = useState(false)
  const [flash, setFlash] = useState(false)
  const [flashType, setFlashType] =
    useState<'FEAR' | 'GREED' | null>(null)

  const prevValueRef = useRef(50)
  const lastFlashRef = useRef(0)
  const vibrationStrengthRef = useRef(0)

  /* =========================
   * 🔥 SSE 구독
   * ========================= */
  useEffect(() => {
    const unsub = subscribeSentiment(
      symbol.toUpperCase(),
      (sentiment) => {
        if (!Number.isFinite(sentiment)) return

        const prev = prevValueRef.current
        const diff = Math.abs(sentiment - prev)

        /* 🔥 급격한 변화 glow */
        if (diff >= 12) {
          setGlow(true)
          vibrationStrengthRef.current = 4
          setTimeout(() => setGlow(false), 1200)
        }

        /* 🔥 EXTREME 진입 감지 */
        const enteringFear =
          sentiment < 15 && prev >= 15
        const enteringGreed =
          sentiment > 85 && prev <= 85

        const now = Date.now()
        const cooldown =
          now - lastFlashRef.current > 5000

        if (
          (enteringFear || enteringGreed) &&
          cooldown
        ) {
          lastFlashRef.current = now
          setFlash(true)
          setFlashType(
            enteringFear ? 'FEAR' : 'GREED',
          )
          setTimeout(() => setFlash(false), 800)
        }

        prevValueRef.current = sentiment
        setValue(sentiment)
      },
    )

    return () => unsub()
  }, [symbol])

  /* =========================
   * 회전값
   * ========================= */
  const rotation = (value / 100) * 180 - 90

  /* =========================
   * 진동 감쇠 로직
   * ========================= */
  const vibration =
    vibrationStrengthRef.current > 0
      ? [
          0,
          -vibrationStrengthRef.current,
          vibrationStrengthRef.current,
          -vibrationStrengthRef.current / 2,
          0,
        ]
      : 0

  if (vibrationStrengthRef.current > 0) {
    vibrationStrengthRef.current *= 0.7
    if (vibrationStrengthRef.current < 0.5) {
      vibrationStrengthRef.current = 0
    }
  }

  return (
    <>
      {/* 🔥 Full Screen Flash */}
      <VIPSentimentFlashOverlay
        show={flash}
        type={flashType}
      />

      <motion.div
        animate={{
          boxShadow: glow
            ? `0 0 30px ${getColor(value)}55`
            : '0 0 0px transparent',
        }}
        transition={{ duration: 0.8 }}
        className="bg-neutral-900 border border-neutral-800 rounded-xl p-6"
      >
        <div className="text-sm text-neutral-400 mb-4">
          Market Sentiment Index (시장 심리 지수)
        </div>

        <div className="relative h-44 flex items-end justify-center overflow-hidden">
          {/* 반원 배경 */}
          <div className="absolute w-72 h-72 rounded-full border-[14px] border-neutral-800 top-[-160px]" />

          {/* arc */}
          <div
            className="absolute w-72 h-72 rounded-full top-[-160px]"
            style={{
              background: `conic-gradient(
                ${getColor(value)} 0deg ${value * 1.8}deg,
                transparent ${value * 1.8}deg 180deg
              )`,
              maskImage:
                'radial-gradient(circle at center, transparent 58%, black 59%)',
              WebkitMaskImage:
                'radial-gradient(circle at center, transparent 58%, black 59%)',
            }}
          />

          {/* 바늘 */}
          <motion.div
            initial={{ rotate: -90 }}
            animate={{
              rotate: rotation,
              x: vibration,
            }}
            transition={{
              rotate: { duration: 0.6, ease: 'easeOut' },
              x: { duration: 0.35 },
            }}
            className="absolute w-72 h-72 top-[-160px]"
            style={{ transformOrigin: '50% 50%' }}
          >
            <div
              className="absolute w-[3px] h-36 bottom-0 left-1/2"
              style={{
                background: getColor(value),
                transform: 'translateX(-50%)',
              }}
            />
          </motion.div>

          {/* 중앙 값 */}
          <div className="relative z-10 text-center">
            <div className="text-3xl font-bold text-white">
              {value}
            </div>
            <div
              className="text-sm mt-1 font-medium"
              style={{ color: getColor(value) }}
            >
              {getLabel(value)}
            </div>
          </div>
        </div>

        <div className="mt-3 flex justify-between text-xs text-neutral-500">
          <span>0</span>
          <span>50</span>
          <span>100</span>
        </div>
      </motion.div>
    </>
  )
}
