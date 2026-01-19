'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

type Guide = {
  action: 'LONG' | 'SHORT' | 'HOLD'
  reason: string
}

export function PositionGuideCard() {
  const [guide, setGuide] = useState<Guide | null>(null)

  useEffect(() => {
    fetch('/api/position-guide')
      .then(res => res.json())
      .then(data => setGuide(data))
      .catch(() => setGuide(null))
  }, [])

  if (!guide) {
    return (
      <div className="border rounded-lg p-4 bg-black/40 text-gray-400 text-sm">
        Loading guide...
      </div>
    )
  }

  const color =
    guide.action === 'LONG'
      ? 'text-emerald-400'
      : guide.action === 'SHORT'
      ? 'text-red-400'
      : 'text-yellow-300'

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="border rounded-lg p-4 bg-black/40"
    >
      <div className="text-xs text-gray-400 mb-1">
        ACTION GUIDE
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div className={`text-2xl font-bold ${color}`}>
            {guide.action}
          </div>
          <div className="text-xs text-gray-400">
            {guide.reason}
          </div>
        </div>

        <button
          className="
            px-3 py-1 rounded-md text-sm
            bg-white/10 hover:bg-white/20
          "
        >
          View Details
        </button>
      </div>
    </motion.div>
  )
}
