'use client'

import { useEffect, useRef } from 'react'
import { notifyVipExtreme } from '@/lib/vip/vipRiskNotifier'
import type { RiskLevel } from '@/lib/vip/riskTypes'

export function useVipExtremeNotifier(
  userId: string,
  riskLevel: RiskLevel,
) {
  const firedRef = useRef(false)

  useEffect(() => {
    if (!userId) return

    if (riskLevel === 'EXTREME' && !firedRef.current) {
      notifyVipExtreme(userId)
      firedRef.current = true
    }

    if (riskLevel !== 'EXTREME') {
      firedRef.current = false
    }
  }, [riskLevel, userId])
}
