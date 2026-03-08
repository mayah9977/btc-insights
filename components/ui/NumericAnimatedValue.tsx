'use client'

import { useEffect, useRef, useMemo, useState } from 'react'

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
  flashOnChange?: boolean
  disableAnimation?: boolean
  className?: string
}

const FLASH_DURATION = 200

export function NumericAnimatedValue({
  value,
  prefix = '',
  suffix = '',
  format,
  glowMode = 'direction',
  size = 'md',
  flash = true,
  flashOnChange = true,
  disableAnimation = false,
  className = '',
}: NumericAnimatedValueProps) {

  const prevRef = useRef<number | null>(null)
  const [flashState, setFlashState] = useState<'UP' | 'DOWN' | null>(null)

  const prevValue = prevRef.current

  /* =========================
     Flash Trigger
  ========================= */

  useEffect(() => {

    if (!flashOnChange) {
      prevRef.current = value ?? null
      return
    }

    if (value == null) return

    if (prevValue != null && flash) {

      const diff = value - prevValue

      if (diff !== 0) {

        setFlashState(diff > 0 ? 'UP' : 'DOWN')

        const timer = setTimeout(() => {
          setFlashState(null)
        }, FLASH_DURATION)

        return () => clearTimeout(timer)

      }

    }

    prevRef.current = value

  }, [value, flash, flashOnChange, prevValue])

  /* =========================
     Glow Color
  ========================= */

  const glowColor = useMemo(() => {

    if (glowMode === 'none') return 'transparent'

    if (flashState === 'UP')
      return 'rgba(34,197,94,0.9)'

    if (flashState === 'DOWN')
      return 'rgba(239,68,68,0.9)'

    return 'transparent'

  }, [flashState, glowMode])

  /* =========================
     Size System
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
     Flash Class
  ========================= */

  const flashClass =
    flashState === 'UP'
      ? 'numeric-flash-up'
      : flashState === 'DOWN'
      ? 'numeric-flash-down'
      : ''

  /* =========================
     Render
  ========================= */

  return (
    <div className={`relative inline-flex items-center ${flashClass}`}>

      <span
        className={`font-semibold ${sizeClass} ${className}`}
        style={{
          textShadow:
            flashState && glowMode !== 'none'
              ? `0 0 12px ${glowColor}`
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
      </span>

      <style jsx>{`
        .numeric-flash-up {
          animation: flashUp ${FLASH_DURATION}ms ease-out;
        }

        .numeric-flash-down {
          animation: flashDown ${FLASH_DURATION}ms ease-out;
        }

        @keyframes flashUp {
          0% { background-color: rgba(34,197,94,0.25); }
          100% { background-color: transparent; }
        }

        @keyframes flashDown {
          0% { background-color: rgba(239,68,68,0.25); }
          100% { background-color: transparent; }
        }
      `}</style>

    </div>
  )
}
