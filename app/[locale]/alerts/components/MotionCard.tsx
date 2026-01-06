'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

export default function MotionCard({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: 'spring',
        stiffness: 120,
        damping: 18,
        mass: 0.8,
      }}
      whileHover={{
        scale: 1.02,
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
