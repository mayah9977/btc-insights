'use client'

import { motion, AnimatePresence } from 'framer-motion'

type Props = {
  show: boolean
  type: 'FEAR' | 'GREED' | null
}

export function VIPSentimentFlashOverlay({
  show,
  type,
}: Props) {

  /* =================================
     SENTIMENT FLASH OVERLAY DISABLED
  ================================= */

  return null

}
