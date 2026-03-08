'use client'

import { useEffect, useRef, useState } from 'react'
import { BollingerSignalType } from '@/lib/market/actionGate/signalType'

/**
 * Premium Signal Animation Hook
 *
 * 목적
 * BollingerSignalType 변화 감지 → UI Animation Trigger
 *
 * 원칙
 * - 계산 ❌
 * - 판단 ❌
 * - UI 이벤트만 처리
 */

export interface PremiumSignalAnimation {
  flash: boolean
  pulse: boolean
  transition: boolean
}

export function usePremiumSignalAnimation(
  signalType?: BollingerSignalType
): PremiumSignalAnimation {

  const prevRef = useRef<BollingerSignalType | undefined>()

  const [flash, setFlash] = useState(false)
  const [pulse, setPulse] = useState(false)
  const [transition, setTransition] = useState(false)

  useEffect(() => {

    const prev = prevRef.current
    const next = signalType

    if (!prev || !next) {
      prevRef.current = next
      return
    }

    /* =====================================================
       1️⃣ Flash (signal change)
    ===================================================== */

    if (prev !== next) {

      setFlash(true)

      const t = setTimeout(() => {
        setFlash(false)
      }, 400)

      /* =====================================================
         2️⃣ Pulse (extreme volatility)
      ===================================================== */

      const extremeSignals = [
        BollingerSignalType.INSIDE_UPPER_BREAK_AND_DEVIATE,
        BollingerSignalType.INSIDE_LOWER_BREAK_AND_DEVIATE,
      ]

      if (extremeSignals.includes(next)) {

        setPulse(true)

        setTimeout(() => {
          setPulse(false)
        }, 1800)
      }

      /* =====================================================
         3️⃣ Trend Transition
      ===================================================== */

      const prevCenter =
        prev === BollingerSignalType.INSIDE_CENTER

      const nextTrend =
        next !== BollingerSignalType.INSIDE_CENTER

      if (prevCenter && nextTrend) {

        setTransition(true)

        setTimeout(() => {
          setTransition(false)
        }, 800)
      }

      return () => clearTimeout(t)
    }

    prevRef.current = next

  }, [signalType])

  return {
    flash,
    pulse,
    transition,
  }
}
