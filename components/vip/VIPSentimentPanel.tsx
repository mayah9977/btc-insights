'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useSpring, useMotionValue } from 'framer-motion'
import { subscribeSentiment } from '@/lib/realtime/marketChannel'
import { VIPSentimentFlashOverlay } from './VIPSentimentFlashOverlay'
import VIPSentimentGuide from './VIPSentimentGuide'

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
  if (v < 25) return '#ef4444'
  if (v < 45) return '#f97316'
  if (v < 60) return '#eab308'
  if (v < 75) return '#22c55e'
  return '#10b981'
}

export default function VIPSentimentPanel({
  symbol = 'BTCUSDT',
}: Props) {

  const [value, setValue] = useState(50)
  const [flash, setFlash] = useState(false)
  const [flashType, setFlashType] =
    useState<'FEAR' | 'GREED' | null>(null)

  const prevValueRef = useRef(50)
  const lastFlashRef = useRef(0)

  const motionVal = useMotionValue(50)
  const smoothValue = useSpring(motionVal, {
    stiffness: 80,
    damping: 20,
  })

  /* =========================================
     🔥 1️⃣ 초기값 Redis에서 Hydration
  ========================================= */
  useEffect(() => {
    const loadInitial = async () => {
      try {
        const res = await fetch('/api/market/sentiment', {
          cache: 'no-store',
        })

        if (!res.ok) return

        const json = await res.json()

        if (json?.ok && Number.isFinite(json.sentiment)) {
          motionVal.set(json.sentiment)
          setValue(json.sentiment)
          prevValueRef.current = json.sentiment
        }
      } catch (err) {
        console.error('initial sentiment load failed', err)
      }
    }

    loadInitial()
  }, [])

  /* =========================================
     🔥 2️⃣ SSE 실시간 구독
  ========================================= */
  useEffect(() => {
    const unsub = subscribeSentiment(
      symbol.toUpperCase(),
      (sentiment) => {
        if (!Number.isFinite(sentiment)) return

        const prev = prevValueRef.current

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
          setTimeout(() => setFlash(false), 900)
        }

        prevValueRef.current = sentiment
        motionVal.set(sentiment)
        setValue(sentiment)
      },
    )

    return () => unsub()
  }, [symbol])

  const rotation = (value / 100) * 180 - 90

  return (
    <>
      <VIPSentimentFlashOverlay
        show={flash}
        type={flashType}
      />

      <motion.div
        animate={{
          boxShadow: `0 0 50px ${getColor(value)}33`,
        }}
        transition={{ duration: 0.6 }}
        className="
          relative
          rounded-2xl
          p-[2px]
          bg-gradient-to-r
          from-neutral-800
          via-neutral-600
          to-neutral-800
        "
      >
        <div className="relative bg-black rounded-2xl p-8 overflow-hidden">

          {/* Background aura */}
          <motion.div
            animate={{ opacity: [0.05, 0.12, 0.05] }}
            transition={{ repeat: Infinity, duration: 4 }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          />

          <div className="text-sm text-neutral-400 mb-6">
            Market Sentiment Index (시장 심리 지수)
          </div>

          <div className="relative h-52 flex items-end justify-center">

            <div className="absolute w-80 h-80 rounded-full border border-neutral-700 top-[-180px]" />

            <motion.div
              className="absolute w-80 h-80 rounded-full top-[-180px]"
              style={{
                background: `conic-gradient(
                  ${getColor(value)} 0deg ${value * 1.8}deg,
                  transparent ${value * 1.8}deg 180deg
                )`,
                maskImage:
                  'radial-gradient(circle at center, transparent 60%, black 61%)',
                WebkitMaskImage:
                  'radial-gradient(circle at center, transparent 60%, black 61%)',
              }}
            />

            <motion.div
              animate={{ rotate: rotation }}
              transition={{
                duration: 0.8,
                ease: 'easeOut',
              }}
              className="absolute w-80 h-80 top-[-180px]"
              style={{ transformOrigin: '50% 50%' }}
            >
              <div
                className="absolute w-[3px] h-40 bottom-0 left-1/2"
                style={{
                  background: getColor(value),
                  transform: 'translateX(-50%)',
                }}
              />
            </motion.div>

            <div className="relative z-10 text-center">
              <motion.div
                style={{ color: getColor(value) }}
                className="text-4xl font-bold"
              >
                {value}
              </motion.div>

              <motion.div
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="text-sm mt-2"
                style={{ color: getColor(value) }}
              >
                {getLabel(value)}
              </motion.div>
            </div>

          </div>

          <div className="mt-6 flex justify-between text-xs text-neutral-500">
            <span>0</span>
            <span>50</span>
            <span>100</span>
          </div>

        </div>
      </motion.div>

      <VIPSentimentGuide value={value} />
    </>
  )
}
