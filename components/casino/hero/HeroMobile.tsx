// components/casino/hero/HeroMobile.tsx
'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useVipOverviewStore } from '@/lib/vip/overviewStore'
import HeroCTAMobile from '@/components/casino/cta/HeroCTAMobile'

export default function HeroMobile({
  isLoggedIn,
  isVIP,
  title,
  description,
}: {
  isLoggedIn: boolean
  isVIP: boolean
  title?: string
  description?: string
}) {
  const { riskLevel } = useVipOverviewStore()

  const [glitch, setGlitch] = useState(false)

  /* =========================
    ⚡ GLITCH RANDOM TRIGGER
  ========================= */
  useEffect(() => {
    let timer: NodeJS.Timeout

    const trigger = () => {
      const delay = 2000 + Math.random() * 3000
      timer = setTimeout(() => {
        setGlitch(true)

        setTimeout(() => {
          setGlitch(false)
          trigger()
        }, 120)
      }, delay)
    }

    trigger()
    return () => clearTimeout(timer)
  }, [])

  const toneMap = {
    LOW: 'from-emerald-500/10',
    MEDIUM: 'from-yellow-500/10',
    HIGH: 'from-orange-500/15',
    EXTREME: 'from-red-600/25',
  }

  const gradientTone = toneMap[riskLevel]

  const titleMap = {
    LOW: '시장 안정 구간',
    MEDIUM: '변동성 확대 구간',
    HIGH: '위험 신호 증가',
    EXTREME: '고위험 구조 감지',
  }

  const descMap = {
    LOW: '현재 시장은 비교적 안정적인 흐름을 보입니다.',
    MEDIUM: '가격 변동성이 확대될 가능성이 있습니다.',
    HIGH: '비정상적인 흐름이 감지되고 있습니다.',
    EXTREME: '구조적 위험이 매우 높은 상태입니다.',
  }

  // ✅ props 우선 사용, 없으면 기존 로직 fallback
  const finalTitle = title ?? titleMap[riskLevel]
  const finalDesc = description ?? descMap[riskLevel]

  return (
    <section
      className={`
        relative overflow-hidden
        rounded-2xl border border-vipBorder
        bg-vipCard
        p-5
        space-y-4
        shadow-[0_20px_60px_rgba(0,0,0,0.7)]
        bg-gradient-to-br ${gradientTone}
      `}
    >
      {/* =========================
          🔴 RED PULSE (OUTER ONLY)
      ========================= */}
      <motion.div
        className="absolute -inset-[2px] rounded-2xl pointer-events-none z-10"
        animate={{
          boxShadow: [
            '0 0 0px rgba(255,0,0,0)',
            '0 0 25px rgba(255,0,0,0.5)',
            '0 0 0px rgba(255,0,0,0)',
          ],
        }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* =========================
          📡 SCANLINE (STABLE)
      ========================= */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-15"
        animate={{ y: ['-100%', '100%'] }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{
          background:
            'linear-gradient(to bottom, transparent, rgba(255,0,0,0.12), transparent)',
        }}
      />

      {/* =========================
          ⚡ GLITCH (LIGHT)
      ========================= */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-30"
        animate={
          glitch
            ? {
                x: [0, -1, 1, 0],
                skewX: [0, -2, 2, 0],
                opacity: [1, 0.85, 1],
              }
            : { x: 0, skewX: 0, opacity: 1 }
        }
        transition={{ duration: 0.12 }}
      />

      {/* subtle grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]
        bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),
        linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)]
        bg-[size:32px_32px]"
      />

      {/* =========================
          CONTENT
      ========================= */}
      <div className="space-y-1 relative z-20">
        <div className="text-[10px] tracking-widest text-zinc-400 uppercase">
          AI Risk Engine
        </div>

        <h1 className="text-xl font-bold text-white leading-snug">
          {finalTitle}
        </h1>
      </div>

      <p className="text-sm text-zinc-400 leading-relaxed relative z-20">
        {finalDesc}
      </p>

      <div className="h-px bg-white/10 relative z-20" />

      <div className="relative z-20">
        <HeroCTAMobile isLoggedIn={isLoggedIn} isVIP={isVIP} />
      </div>
    </section>
  )
}
