'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useVipOverviewStore } from '@/lib/vip/overviewStore'
import { useEffect, useRef, useState } from 'react'

export default function MarketPulseShock() {
  const { riskLevel } = useVipOverviewStore()
  const prev = useRef<typeof riskLevel | null>(null)
  const [shock, setShock] = useState(false)

  useEffect(() => {
    if (prev.current === 'HIGH' && riskLevel === 'EXTREME') {
      setShock(true)
      setTimeout(() => setShock(false), 300)
    }
    prev.current = riskLevel
  }, [riskLevel])

  return (
    <AnimatePresence>
      {shock && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.15 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 bg-red-600 pointer-events-none"
        />
      )}
    </AnimatePresence>
  )
}
