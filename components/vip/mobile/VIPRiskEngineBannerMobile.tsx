'use client'

import { useEffect, useRef, useState } from 'react'

export default function VIPRiskEngineBannerMobile() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)

  const scanTRef = useRef(0)
  const dirRef = useRef<1 | -1>(1)

  const [rgb, setRgb] = useState({ r: 0, g: 0, b: 0 })

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
    <div className="px-4 mt-2">
      <div className="relative rounded-xl overflow-hidden border border-white/10">

        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
        />

        <div className="relative z-10 px-4 py-3 backdrop-blur bg-black/40">

          <div
            className="text-sm font-bold"
            style={{
              color: `rgb(${rgb.r},${rgb.g},${rgb.b})`,
              textShadow: `
                0 0 6px rgb(${rgb.r},${rgb.g},${rgb.b}),
                0 0 12px rgb(${rgb.r},${rgb.g},${rgb.b})
              `,
            }}
          >
            AI is observing the market in real time...
          </div>

          <div className="text-[11px] font-mono text-white/70">
            RGB({rgb.r}, {rgb.g}, {rgb.b}) | {hex}
          </div>

        </div>
      </div>
    </div>
  )
}
