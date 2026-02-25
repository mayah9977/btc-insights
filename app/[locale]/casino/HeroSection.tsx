'use client'
import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useVipOverviewStore } from '@/lib/vip/overviewStore'
import HeroCTA from './HeroCTA'

export default function HeroSection({
  isLoggedIn,
  isVIP,
}: {
  isLoggedIn: boolean
  isVIP: boolean
}) {
  const { riskLevel } = useVipOverviewStore()
  const [dwell, setDwell] = useState(0)

  /* =========================
     HUD Canvas + RGB Reader
  ========================= */

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

  useEffect(() => {
    const id = setInterval(() => {
      setDwell((d) => d + 1)
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const heroTitle =
    'AI 실시간 데이터 기반 확률적 위험 감지 모델'

  const heroDesc =
    '본 시스템은 매수/매도 신호가 아닌 데이터를 기반으로 위험구간을 알려 사용자의 손실을 줄이는것을 목적으로 설계되었습니다.'

  const toneMap = {
    LOW: 'from-emerald-500/10',
    MEDIUM: 'from-yellow-500/10',
    HIGH: 'from-orange-500/15',
    EXTREME: 'from-red-600/25',
  }

  const gradientTone = toneMap[riskLevel]
  const brightness =
    riskLevel === 'HIGH' || riskLevel === 'EXTREME'
      ? 'brightness-110'
      : ''

  const extremePulse =
    riskLevel === 'EXTREME'
      ? { scale: [1, 1.02, 1] }
      : {}

  const showVignette = dwell >= 45

  return (
    <motion.section
      animate={extremePulse}
      transition={{
        duration: 0.8,
        repeat: riskLevel === 'EXTREME' ? Infinity : 0,
        repeatDelay: 3,
      }}
      className={`
        relative overflow-hidden
        rounded-3xl border border-vipBorder
        bg-vipCard p-6 md:p-12
        shadow-[0_40px_120px_rgba(0,0,0,0.8)]
        bg-gradient-to-br ${gradientTone}
        ${brightness}
        transition-all duration-700
        space-y-10
      `}
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.05]
        bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),
        linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)]
        bg-[size:40px_40px]" />

      {showVignette && (
        <div className="pointer-events-none absolute inset-0
          bg-[radial-gradient(circle,transparent_60%,rgba(0,0,0,0.6))]
          opacity-60 transition-opacity duration-1000" />
      )}

      {isLoggedIn && (
        <div className="relative rounded-xl overflow-hidden border border-white/10 shadow-lg">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
          />

          <div className="relative z-10 px-6 py-5 backdrop-blur-md bg-black/30 flex flex-col gap-2">
            <div
              className="text-xl font-bold tracking-wide"
              style={{
                color: `rgb(${rgb.r},${rgb.g},${rgb.b})`,
                textShadow: `
                  0 0 6px rgb(${rgb.r},${rgb.g},${rgb.b}),
                  0 0 12px rgb(${rgb.r},${rgb.g},${rgb.b}),
                  0 0 24px rgb(${rgb.r},${rgb.g},${rgb.b})
                `,
              }}
            >
              Structural Risk Engine actively analyzing real-time market dynamics...
            </div>

            <div className="text-xs font-mono text-white/80">
              RGB({rgb.r}, {rgb.g}, {rgb.b}) | {hex}
            </div>
          </div>
        </div>
      )}

      <div className="relative space-y-5">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white">
          {heroTitle}
        </h1>

        <p className="text-zinc-400 text-lg max-w-2xl">
          {heroDesc}
        </p>
      </div>

      <HeroCTA
        isLoggedIn={isLoggedIn}
        isVIP={isVIP}
        autoScale={riskLevel === 'EXTREME'}
      />
    </motion.section>
  )
}
