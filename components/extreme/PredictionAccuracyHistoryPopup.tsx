'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  calcPredictionReliabilityRank,
} from '@/lib/vip/predictionReliabilityStore'

type Props = {
  open: boolean
  onClose: () => void
}

export function PredictionAccuracyHistoryPopup({
  open,
  onClose,
}: Props) {
  if (!open) return null

  const { score, rank } =
    calcPredictionReliabilityRank()

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="w-80 rounded-xl border bg-black p-4"
          >
            <h3 className="text-sm font-semibold mb-2">
              Prediction Accuracy History
            </h3>

            <div className="space-y-1 text-sm">
              <div>
                Accuracy Score:{' '}
                <strong>
                  {(score * 100).toFixed(1)}%
                </strong>
              </div>
              <div>
                Current Rank:{' '}
                <strong>{rank}</strong>
              </div>
            </div>

            <p className="mt-3 text-xs text-gray-400">
              Accuracy is calculated based on whether
              predicted high-risk events actually
              occurred.
            </p>

            <button
              className="mt-4 w-full rounded-md bg-white/10 py-1 text-sm"
              onClick={onClose}
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
