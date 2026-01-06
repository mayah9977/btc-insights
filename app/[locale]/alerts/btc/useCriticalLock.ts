'use client'

import { useEffect, useState } from 'react'

const CRITICAL_PRICE = 98_000
const KEY = 'BTC_CRITICAL_LOCK'

export function useCriticalLock(price: number | null) {
  const [locked, setLocked] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(KEY) === 'true'
  })

  useEffect(() => {
    if (price === null) return
    if (price <= CRITICAL_PRICE && !locked) {
      localStorage.setItem(KEY, 'true')
      setLocked(true)
    }
  }, [price, locked])

  const unlock = () => {
    localStorage.removeItem(KEY)
    setLocked(false)
  }

  return { locked, unlock }
}
