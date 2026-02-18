'use client'

import { useEffect, useRef, useState } from 'react'
import { BollingerSignalType } from '@/lib/market/actionGate/signalType'

/* =====================================================
   🔥 해석 변경 순간 감지 → 플래시 트리거
===================================================== */

export function useInterpretationTransition(
  signalType?: BollingerSignalType
) {
  const prevRef = useRef<BollingerSignalType | undefined>(undefined)
  const [flash, setFlash] = useState(false)

  useEffect(() => {
    if (
      prevRef.current &&
      signalType &&
      prevRef.current !== signalType
    ) {
      setFlash(true)

      const timer = setTimeout(() => {
        setFlash(false)
      }, 400)

      return () => clearTimeout(timer)
    }

    prevRef.current = signalType
  }, [signalType])

  return { flash }
}
