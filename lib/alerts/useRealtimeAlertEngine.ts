'use client'

import { useEffect, useRef } from 'react'
import { useRealtimeMarket } from '@/lib/realtime/useRealtimeMarket'
import {
  matchRealtimeAlert,
  type RealtimeAlertRule,
} from './realtimeAlertRules'

export function useRealtimeAlertEngine(
  rules: RealtimeAlertRule[],
  onTriggered: (rule: RealtimeAlertRule) => void
) {
  const market = useRealtimeMarket()
  const triggeredRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    for (const rule of rules) {
      if (triggeredRef.current.has(rule.id)) continue

      if (matchRealtimeAlert(rule, market)) {
        triggeredRef.current.add(rule.id)
        onTriggered(rule)
      }
    }
  }, [
    market.price,
    market.openInterest,
    rules,
    onTriggered,
  ])
}
