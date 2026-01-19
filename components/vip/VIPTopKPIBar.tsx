'use client'

import { motion } from 'framer-motion'

type Props = {
  btcPrice: number
  avoidedExtremeCount: number
  avoidedLossUSD: number
}

export default function VIPTopKPIBar({
  btcPrice,
  avoidedExtremeCount,
  avoidedLossUSD,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="
        sticky top-0 z-40
        bg-black/80 backdrop-blur
        border-b border-neutral-800
      "
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 px-4 py-3">
        {/* BTC PRICE */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          <p className="text-xs text-neutral-400">BTC PRICE</p>
          <p className="text-2xl font-bold text-white">
            ${btcPrice.toLocaleString()}
          </p>
        </div>

        {/* EXTREME AVOIDED */}
        <div className="bg-green-950/40 border border-green-800 rounded-xl p-4">
          <p className="text-xs text-green-400">
            EXTREME AVOIDED (TODAY)
          </p>
          <p className="text-2xl font-bold text-green-300">
            +{avoidedExtremeCount}
          </p>
        </div>

        {/* AVOIDED LOSS */}
        <div className="bg-yellow-950/40 border border-yellow-800 rounded-xl p-4">
          <p className="text-xs text-yellow-400">
            AVOIDED LOSS (VIRTUAL P/L)
          </p>
          <p className="text-2xl font-bold text-yellow-300">
            ${avoidedLossUSD.toLocaleString()}
          </p>
        </div>
      </div>
    </motion.div>
  )
}
