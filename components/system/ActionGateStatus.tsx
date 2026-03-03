'use client'

import React, { useEffect, useRef, useState } from 'react'

export type ActionGateState = 'OBSERVE' | 'CAUTION' | 'IGNORE'

interface ActionGateStatusProps {
  state?: ActionGateState
  symbol?: string
}

export const ActionGateStatus: React.FC<ActionGateStatusProps> = ({
  state = 'OBSERVE',
  symbol,
}) => {

  /* =========================
     🔥 디버그 로그 (실제 수신 상태 확인)
  ========================= */

  useEffect(() => {
    console.log('[ActionGateStatus] render', {
      symbol,
      state,
    })
  }, [state, symbol])

  /* =========================
     🎨 상태별 색상 결정
  ========================= */

  const getOverlayColor = () => {
    switch (state) {
      case 'CAUTION':
        return 'bg-yellow-900/40'
      case 'IGNORE':
        return 'bg-red-900/40'
      case 'OBSERVE':
      default:
        return 'bg-black/30'
    }
  }

  const getBorderColor = () => {
    switch (state) {
      case 'CAUTION':
        return 'border-yellow-500/40'
      case 'IGNORE':
        return 'border-red-500/40'
      default:
        return 'border-white/10'
    }
  }

  /* =========================
     🎨 RGB Canvas Logic
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
      grad.addColorStop(0, 'hsl(0, 90%, 55%)')
      grad.addColorStop(0.2, 'hsl(40, 90%, 55%)')
      grad.addColorStop(0.4, 'hsl(120, 90%, 55%)')
      grad.addColorStop(0.6, 'hsl(200, 90%, 55%)')
      grad.addColorStop(0.8, 'hsl(260, 90%, 55%)')
      grad.addColorStop(1, 'hsl(330, 90%, 55%)')

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

  /* =========================
     🎯 Render
  ========================= */

  return (
    <div
      className={`relative rounded-xl overflow-hidden border shadow-lg ${getBorderColor()}`}
    >

      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />

      <div
        className={`relative z-10 px-6 py-4 backdrop-blur-md flex flex-col gap-2 ${getOverlayColor()}`}
      >
        <div
          className="text-base font-semibold tracking-wide"
          style={{
            color: `rgb(${rgb.r},${rgb.g},${rgb.b})`,
          }}
        >
          AI Gate Status: {state}
        </div>

        <div className="text-xs font-mono text-white/80">
          RGB({rgb.r}, {rgb.g}, {rgb.b}) | {hex}
        </div>
      </div>
    </div>
  )
}
