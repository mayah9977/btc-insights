'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * 고래 강도 기반 쿨다운 계산
 * weight: 0 ~ 1
 */
export function calcWhaleCooldown(
  weight: number,
  extreme: boolean,
): number {
  const base = 5000
  const curve = Math.pow(weight, 1.5)
  const extra = Math.min(25000, curve * 25000)

  let cooldown = base + extra

  if (extreme) {
    cooldown *= 0.6
  }

  return Math.round(cooldown)
}

export function useWhaleCooldown(symbol: string) {
  const [cooldownMs, setCooldownMs] = useState(0)
  const [remainingMs, setRemainingMs] = useState(0)
  const timerRef = useRef<number | null>(null)

  const clear = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const triggerCooldown = (weight: number, extreme: boolean) => {
    clear()

    const duration = calcWhaleCooldown(weight, extreme)
    const start = Date.now()

    setCooldownMs(duration)
    setRemainingMs(duration)

    timerRef.current = window.setInterval(() => {
      const left = duration - (Date.now() - start)
      setRemainingMs(Math.max(0, left))

      if (left <= 0) {
        clear()
      }
    }, 100)
  }

  // 🔁 symbol 변경 시 완전 리셋
  useEffect(() => {
    clear()
    setCooldownMs(0)
    setRemainingMs(0)

    return clear
  }, [symbol])

  return {
    cooldownMs,
    remainingMs,
    triggerCooldown,
  }
}
