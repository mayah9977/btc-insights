'use client'

import { motion, useMotionValue, useTransform } from 'framer-motion'
import { ReactNode } from 'react'
import clsx from 'clsx'

export default function TiltCard({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const rotateX = useTransform(y, [-60, 60], [6, -6])
  const rotateY = useTransform(x, [-60, 60], [-6, 6])

  return (
    <motion.div
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse') return

        const rect = e.currentTarget.getBoundingClientRect()
        x.set(e.clientX - rect.left - rect.width / 2)
        y.set(e.clientY - rect.top - rect.height / 2)
      }}
      onPointerLeave={() => {
        x.set(0)
        y.set(0)
      }}
      style={{
        rotateX,
        rotateY,
        perspective: 900, // ✅ 핵심
      }}
      whileHover={{ scale: 1.015 }}
      transition={{ type: 'spring', stiffness: 160, damping: 22 }}
      className="relative will-change-transform"
    >
      {/* ✅ 카드 실체 */}
      <div
        className={clsx(
          'relative overflow-hidden rounded-2xl',
          'bg-vipCard border border-vipBorder',
          className,
        )}
      >
        {children}
      </div>
    </motion.div>
  )
}
