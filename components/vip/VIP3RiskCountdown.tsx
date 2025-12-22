'use client'

import { useEffect, useState } from 'react'
import { calcPressureIndex } from '@/lib/notification/calcPressureIndex'

export function VIP3RiskCountdown() {
  const [seconds, setSeconds] = useState(300) // 5분

  useEffect(() => {
    const interval = setInterval(() => {
      const pressure = calcPressureIndex()
      const decay =
        pressure > 75 ? 3 : pressure > 40 ? 2 : 1

      setSeconds((s) => Math.max(0, s - decay))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  if (seconds <= 0) {
    return (
      <div className="text-sm text-red-400 font-semibold">
        Risk window closing
      </div>
    )
  }

  return (
    <div className="text-sm text-fuchsia-300">
      Risk decay in{' '}
      <strong>
        {Math.floor(seconds / 60)}:
        {(seconds % 60).toString().padStart(2, '0')}
      </strong>
    </div>
  )
}
