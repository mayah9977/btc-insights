'use client'

import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useVIPMarketStore } from '@/lib/market/store/vipMarketStore'

export type ActionGateState = 'OBSERVE' | 'CAUTION' | 'IGNORE'

interface ActionGateStatusProps {
  symbol?: string
}

export const ActionGateStatus: React.FC<ActionGateStatusProps> = ({
  symbol,
}) => {

  const state = useVIPMarketStore(
    (s) => s.actionGateState
  ) as ActionGateState
  /* =========================
     상태 색상
  ========================= */

  const getOverlayColor = () => {
    switch (state) {
      case 'CAUTION':
        return 'bg-yellow-900/40'
      case 'IGNORE':
        return 'bg-red-900/40'
      default:
        return 'bg-black/30'
    }
  }

  const getBorderColor = () => {
    switch (state) {
      case 'CAUTION':
        return 'border-yellow-500/60'
      case 'IGNORE':
        return 'border-red-500/70'
      default:
        return 'border-emerald-400/40'
    }
  }

  const getGlow = () => {
    switch (state) {
      case 'CAUTION':
        return '0 0 40px rgba(250,204,21,0.45)'
      case 'IGNORE':
        return '0 0 50px rgba(239,68,68,0.45)'
      default:
        return '0 0 35px rgba(16,185,129,0.35)'
    }
  }

  /* =========================
     RGB Canvas Logic
  ========================= */

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const scanTRef = useRef(0)
  const dirRef = useRef<1 | -1>(1)

  const [rgb, setRgb] = useState({ r: 113, g: 218, b: 203 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
    }

    resize()
    window.addEventListener('resize', resize)

    const draw = () => {
      const w = canvas.width
      const h = canvas.height

      scanTRef.current += 0.002 * dirRef.current

      if (scanTRef.current >= 1) dirRef.current = -1
      if (scanTRef.current <= 0) dirRef.current = 1

      const scanX = scanTRef.current * w

      const grad = ctx.createLinearGradient(0, 0, w, 0)

      grad.addColorStop(0, 'hsl(0,90%,55%)')
      grad.addColorStop(0.2, 'hsl(40,90%,55%)')
      grad.addColorStop(0.4, 'hsl(120,90%,55%)')
      grad.addColorStop(0.6, 'hsl(200,90%,55%)')
      grad.addColorStop(0.8, 'hsl(260,90%,55%)')
      grad.addColorStop(1, 'hsl(330,90%,55%)')

      ctx.clearRect(0, 0, w, h)

      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)

      ctx.fillStyle = 'rgba(255,255,255,0.35)'
      ctx.fillRect(scanX - 2, 0, 4, h)

      const pixel = ctx.getImageData(
        Math.min(Math.max(Math.floor(scanX), 0), w - 1),
        Math.floor(h / 2),
        1,
        1
      ).data

      setRgb({
        r: pixel[0],
        g: pixel[1],
        b: pixel[2],
      })

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)

    return () => {
      window.removeEventListener('resize', resize)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const hex =
    '#' +
    ((1 << 24) + (rgb.r << 16) + (rgb.g << 8) + rgb.b)
      .toString(16)
      .slice(1)

  return (
    <motion.div
      className={`relative rounded-xl overflow-hidden border shadow-xl ${getBorderColor()}`}
      style={{ boxShadow: getGlow() }}
      animate={{ scale: state === 'IGNORE' ? [1, 1.02, 1] : 1 }}
      transition={{ duration: 2, repeat: state === 'IGNORE' ? Infinity : 0 }}
    >

      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-80"
      />

      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ backgroundPosition: ['0% 0%', '200% 0%'] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        style={{
          backgroundImage:
            'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
          backgroundSize: '200% 100%',
        }}
      />

      <div
        className={`relative z-10 px-6 py-4 backdrop-blur-md flex flex-col gap-2 ${getOverlayColor()}`}
      >
        <div
          className="text-base font-semibold tracking-wide"
          style={{
            color: `rgb(${rgb.r},${rgb.g},${rgb.b})`,
            textShadow: `0 0 14px rgba(${rgb.r},${rgb.g},${rgb.b},0.6)`,
          }}
        >
          AI Gate Status: {state}
        </div>

        <div className="text-xs font-mono text-white/80">
          RGB({rgb.r}, {rgb.g}, {rgb.b}) | {hex}
        </div>
      </div>

    </motion.div>
  )
}
