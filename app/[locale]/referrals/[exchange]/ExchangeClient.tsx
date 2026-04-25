'use client'

import Link from 'next/link'
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionProps,
} from 'framer-motion'
import type { MouseEvent } from 'react'

type Exchange = {
  name: string
  tagline: string
  marketing: string
  benefit: string
  href: string
}

const containerMotion: MotionProps = {
  initial: { opacity: 0, y: 30, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { duration: 0.5 },
  whileHover: {
    scale: 1.03,
    y: -4,
    transition: {
      type: 'spring',
      stiffness: 200,
    },
  },
}

function useInteractiveCard() {
  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)
  const glowX = useMotionValue(0)
  const glowY = useMotionValue(0)

  const rotateYRaw = useTransform(pointerX, [-0.5, 0.5], [-6, 6])
  const rotateXRaw = useTransform(pointerY, [-0.5, 0.5], [6, -6])

  const rotateX = useSpring(rotateXRaw, {
    stiffness: 220,
    damping: 22,
    mass: 0.7,
  })

  const rotateY = useSpring(rotateYRaw, {
    stiffness: 220,
    damping: 22,
    mass: 0.7,
  })

  const glowBackground = useMotionTemplate`
    radial-gradient(
      420px circle at ${glowX}px ${glowY}px,
      rgba(16, 185, 129, 0.22),
      rgba(56, 189, 248, 0.10) 32%,
      transparent 68%
    )
  `

  const handleMouseMove = (event: MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    pointerX.set(x / rect.width - 0.5)
    pointerY.set(y / rect.height - 0.5)
    glowX.set(x)
    glowY.set(y)
  }

  const handleMouseLeave = () => {
    pointerX.set(0)
    pointerY.set(0)
  }

  return {
    rotateX,
    rotateY,
    glowBackground,
    handleMouseMove,
    handleMouseLeave,
  }
}

export default function ExchangeClient({
  exchange,
}: {
  exchange: Exchange
}) {
  const bullets = exchange.marketing
    .split('/')
    .map(v => v.replace('✔', '').trim())

  const headerCard = useInteractiveCard()
  const marketingCard = useInteractiveCard()

  return (
    <main className="min-h-screen bg-vipBg text-slate-100">
      <div className="max-w-4xl mx-auto px-6 py-20 space-y-12">
        {/* HEADER CARD */}
        <motion.header
          initial={containerMotion.initial}
          animate={containerMotion.animate}
          transition={containerMotion.transition}
          whileHover={containerMotion.whileHover}
          onMouseMove={headerCard.handleMouseMove}
          onMouseLeave={headerCard.handleMouseLeave}
          style={{
            rotateX: headerCard.rotateX,
            rotateY: headerCard.rotateY,
            transformPerspective: 900,
            willChange: 'transform',
          }}
          className="relative overflow-hidden bg-vipCard border border-vipBorder rounded-2xl p-6 space-y-5 transition-all duration-300 shadow-[0_0_0_rgba(0,0,0,0)] hover:shadow-[0_18px_55px_rgba(0,0,0,0.7)] hover:border-opacity-90"
        >
          <motion.div
            className="pointer-events-none absolute inset-0 opacity-0 blur-xl"
            style={{ background: headerCard.glowBackground }}
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
          />

          <motion.div
            className="pointer-events-none absolute inset-0 opacity-0 bg-[linear-gradient(115deg,rgba(16,185,129,0.12),rgba(56,189,248,0.10),rgba(251,191,36,0.08),rgba(16,185,129,0.12))] bg-[length:220%_220%] blur-2xl"
            whileHover={{
              opacity: 1,
              backgroundPosition: ['0% 50%', '100% 50%'],
            }}
            transition={{ duration: 0.8 }}
          />

          {/* LIGHT SWEEP */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <motion.div
              initial={{ x: '-120%', opacity: 0 }}
              whileHover={{ x: '120%', opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent blur-lg"
            />
          </div>

          <Link
            href="/ko/referrals"
            className="relative z-10 text-sm text-slate-400 hover:text-slate-200 transition"
          >
            ← 돌아가기
          </Link>

          {/* BADGE */}
          <div className="relative z-10 inline-block text-xs tracking-widest px-3 py-1 rounded-full bg-gradient-to-r from-amber-300/20 to-orange-400/20 border border-amber-300/30 text-amber-200 font-semibold">
            PRO TRADER CHOICE
          </div>

          <div className="relative z-10">
            <h1 className="text-4xl font-extrabold tracking-tight">
              {exchange.name}
            </h1>
            <p className="text-slate-300 mt-3 text-lg font-medium leading-relaxed">
              {exchange.tagline}
            </p>
          </div>
        </motion.header>

        {/* MARKETING CARD */}
        <motion.section
          initial={containerMotion.initial}
          animate={containerMotion.animate}
          transition={{ duration: 0.5, delay: 0.12 }}
          whileHover={containerMotion.whileHover}
          onMouseMove={marketingCard.handleMouseMove}
          onMouseLeave={marketingCard.handleMouseLeave}
          style={{
            rotateX: marketingCard.rotateX,
            rotateY: marketingCard.rotateY,
            transformPerspective: 900,
            willChange: 'transform',
          }}
          className="relative overflow-hidden bg-vipCard border border-vipBorder rounded-2xl p-6 space-y-6 transition-all duration-300 shadow-[0_0_0_rgba(0,0,0,0)] hover:shadow-[0_18px_55px_rgba(0,0,0,0.7)] hover:border-opacity-90"
        >
          <motion.div
            className="pointer-events-none absolute inset-0 opacity-0 blur-xl"
            style={{ background: marketingCard.glowBackground }}
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
          />

          <motion.div
            className="pointer-events-none absolute inset-0 opacity-0 bg-[linear-gradient(115deg,rgba(16,185,129,0.12),rgba(56,189,248,0.10),rgba(251,191,36,0.08),rgba(16,185,129,0.12))] bg-[length:220%_220%] blur-2xl"
            whileHover={{
              opacity: 1,
              backgroundPosition: ['0% 50%', '100% 50%'],
            }}
            transition={{ duration: 0.8 }}
          />

          {/* LIGHT SWEEP */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <motion.div
              initial={{ x: '-120%', opacity: 0 }}
              whileHover={{ x: '120%', opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent blur-lg"
            />
          </div>

          {/* BULLETS */}
          <div className="relative z-10 space-y-3">
            {bullets.map((b, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="text-emerald-400 font-bold">✔</span>
                <span className="font-semibold text-slate-200">{b}</span>
              </div>
            ))}
          </div>

          {/* BENEFIT */}
          <div className="relative z-10 text-sm">
            Fee Benefit{' '}
            <span className="text-emerald-400 font-semibold text-base ml-1">
              {exchange.benefit}
            </span>
          </div>

          {/* CTA BUTTON */}
          <a
            href={exchange.href}
            target="_blank"
            className="relative z-10 inline-block mt-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-300 to-emerald-500 text-black font-semibold text-sm transition-all duration-200 hover:scale-105 hover:shadow-[0_0_20px_rgba(16,185,129,0.5)]"
          >
            클릭해서 수수료할인받고 가입하러가기 →
          </a>
        </motion.section>
      </div>
    </main>
  )
}
