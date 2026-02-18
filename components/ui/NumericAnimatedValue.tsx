'use client'

import { useEffect, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'

type GlowMode = 'none' | 'direction'
type SizeMode = 'sm' | 'md' | 'lg'

interface NumericAnimatedValueProps {
  value: number | null | undefined
  prefix?: string
  suffix?: string
  format?: (v: number) => string
  glowMode?: GlowMode
  size?: SizeMode
  flash?: boolean
  className?: string
}

/* =========================================================
   🔥 BTC Insight Unified Numeric Engine (Final Stable)
========================================================= */

export function NumericAnimatedValue({
  value,
  prefix = '',
  suffix = '',
  format,
  glowMode = 'direction',
  size = 'md',
  flash = true,
  className = '',
}: NumericAnimatedValueProps) {
  const prevRef = useRef<number | null>(null)
  const isFirstRender = useRef(true)

  const prevValue = prevRef.current

  const delta =
    value != null && prevValue != null
      ? value - prevValue
      : 0

  const absDelta = Math.abs(delta)

  /* =========================
     1️⃣ 방향 계산
  ========================= */

  const directionY =
    prevValue == null
      ? 0
      : delta > 0
      ? -8
      : delta < 0
      ? 8
      : 0

  /* =========================
     2️⃣ 강도 계산
  ========================= */

  const intensity = useMemo(() => {
    if (prevValue == null) return 1
    if (absDelta > 200000) return 1.28
    if (absDelta > 100000) return 1.2
    if (absDelta > 50000) return 1.14
    if (absDelta > 10000) return 1.1
    return 1.06
  }, [absDelta, prevValue])

  /* =========================
     3️⃣ 글로우 컬러
  ========================= */

  const glowColor = useMemo(() => {
    if (glowMode === 'none') return 'rgba(0,0,0,0)'
    if (delta > 0) return 'rgba(250,204,21,0.95)'
    if (delta < 0) return 'rgba(239,68,68,0.9)'
    return 'rgba(16,185,129,0.7)'
  }, [delta, glowMode])

  /* =========================
     4️⃣ Size System
  ========================= */

  const sizeClass = useMemo(() => {
    switch (size) {
      case 'sm':
        return 'text-sm'
      case 'lg':
        return 'text-xl md:text-2xl'
      case 'md':
      default:
        return 'text-base md:text-lg'
    }
  }, [size])

  /* =========================
     5️⃣ prev 업데이트
  ========================= */

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
    }

    if (value != null) {
      prevRef.current = value
    }
  }, [value])

  const shouldAnimate =
    prevValue != null && value != null && delta !== 0

  /* =========================
     6️⃣ Render
  ========================= */

  return (
    <div className="relative inline-flex items-center">

      {/* Radial Flash */}
      {flash && shouldAnimate && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: [0, 0.35, 0], scale: [0.9, 1.2, 1] }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 pointer-events-none rounded-lg"
          style={{
            background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
          }}
        />
      )}

      {/* Main Number */}
      <motion.span
        animate={
          shouldAnimate
            ? { y: [directionY, 0], scale: [intensity, 1] }
            : { y: 0, scale: 1 }
        }
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 18,
        }}
        className={`font-semibold ${sizeClass} ${className}`}
        style={{
          textShadow:
            glowMode !== 'none' && shouldAnimate
              ? `0 0 24px ${glowColor}`
              : 'none',
        }}
      >
        {prefix}
        {value != null
          ? format
            ? format(value)
            : value.toLocaleString()
          : '--'}
        {suffix}
      </motion.span>
    </div>
  )
}
