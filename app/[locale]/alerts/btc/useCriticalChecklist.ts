'use client'

import { useEffect, useState } from 'react'

const CRITICAL = 98_000

export type ChecklistKey =
  | 'funding'
  | 'liquidation'
  | 'onchain'
  | 'plan'

export function useCriticalChecklist(price: number | null) {
  const [locked, setLocked] = useState(false)
  const [checks, setChecks] = useState<Record<ChecklistKey, boolean>>({
    funding: false,
    liquidation: false,
    onchain: false,
    plan: false,
  })

  useEffect(() => {
    if (price !== null && price <= CRITICAL) {
      setLocked(true)
    }
  }, [price])

  const toggle = (key: ChecklistKey) => {
    setChecks(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const allChecked = Object.values(checks).every(Boolean)

  const unlock = () => {
    if (!allChecked) return
    setLocked(false)
  }

  return {
    locked,
    checks,
    toggle,
    unlock,
    canTrade: !locked,
  }
}
