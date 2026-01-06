'use client'

import { motion } from 'framer-motion'

export function VIP3GlowWrapper({
  active,
  children,
}: {
  active: boolean
  children: React.ReactNode
}) {
  if (!active) return <>{children}</>

  return (
    <motion.div
      animate={{
        boxShadow: [
          '0 0 0px rgba(255,215,0,0.0)',
          '0 0 12px rgba(255,215,0,0.6)',
          '0 0 0px rgba(255,215,0,0.0)',
        ],
      }}
      transition={{
        duration: 2.4,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className="
        relative z-0
        rounded-xl
      "
    >
      {children}
    </motion.div>
  )
}
