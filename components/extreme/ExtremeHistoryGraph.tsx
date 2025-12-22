'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useRef, useState, useMemo } from 'react'
import { calcPressureIndex } from '@/lib/notification/calcPressureIndex'
import { getExtremeHistory } from '@/lib/extreme/extremeHistoryStore'

type Item = {
  at: number
  reliability: number
}

/**
 * 최근 Extreme 신뢰도 기반
 * 다음 Extreme 발생 확률 (UX 목적)
 */
function calcPrediction(): number {
  const history = getExtremeHistory()
  if (history.length < 3) return 0.2

  const recent = history.slice(-5)
  const avg =
    recent.reduce((a, b) => a + b.reliability, 0) /
    recent.length

  return Math.min(1, Math.max(0, 1 - avg))
}

export function ExtremeHistoryGraph({
  data,
}: {
  data: Item[]
}) {
  const prevLenRef = useRef(data.length)
  const [flash, setFlash] = useState(false)

  const latestIndex = data.length - 1

  /* ===============================
     Risk 계산 (불필요한 재연산 방지)
     =============================== */
  const pressure = useMemo(
    () => calcPressureIndex(),
    []
  )
  const prediction = useMemo(
    () => calcPrediction(),
    []
  )

  const isHighRisk =
    pressure / 100 * 0.6 + prediction * 0.4 > 0.7

  /* ===============================
     WS / SSE 이벤트 → 새 데이터 감지
     =============================== */
  useEffect(() => {
    if (data.length > prevLenRef.current) {
      setFlash(true)

      const t = setTimeout(
        () => setFlash(false),
        isHighRisk ? 350 : 180
      )

      prevLenRef.current = data.length
      return () => clearTimeout(t)
    }
  }, [data.length, isHighRisk])

  return (
    <div className="relative">
      {/* ===============================
          Flash Overlay
         =============================== */}
      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{
              opacity: isHighRisk ? 0.45 : 0.25,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`absolute inset-0 z-10 pointer-events-none ${
              isHighRisk ? 'bg-red-500' : 'bg-white'
            }`}
          />
        )}
      </AnimatePresence>

      {/* ===============================
          Graph Bars
         =============================== */}
      <div className="flex items-end gap-1 h-40">
        {data.map((h, i) => {
          const height = Math.max(
            4,
            h.reliability * 100
          )
          const isLatest = i === latestIndex

          return (
            <motion.div
              key={h.at}
              initial={{ height: 0, opacity: 0 }}
              animate={{
                height: `${height}%`,
                opacity: 1,
                scaleY: isLatest
                  ? [1, 1.15, 1] // 🔥 live-point pulse
                  : 1,
              }}
              transition={{
                height: { duration: 0.35 },
                opacity: { duration: 0.2 },
                scaleY: isLatest
                  ? { duration: 0.4 }
                  : undefined,
              }}
              className={`flex-1 rounded ${
                isHighRisk
                  ? isLatest
                    ? 'bg-red-400'
                    : 'bg-red-600/80'
                  : isLatest
                  ? 'bg-blue-400'
                  : 'bg-blue-600/80'
              }`}
            />
          )
        })}
      </div>
    </div>
  )
}
