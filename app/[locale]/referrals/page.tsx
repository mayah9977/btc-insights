'use client'

import { useCallback } from 'react'
import Link from 'next/link'
import clsx from 'clsx'
import { Playfair_Display, Inter } from 'next/font/google'

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['600', '700'],
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
})

const exchanges = [
  {
    name: 'Binance',
    desc: '유동성 · 체결 안정성 기준 거래소',
    href: '/ko/referrals/binance',
    accent: 'from-yellow-400 to-yellow-600',
    border: 'border-yellow-500/40',
  },
  {
    name: 'OKX',
    desc: '파생상품 · 고급 리스크 관리 기능',
    href: '/ko/referrals/okx',
    accent: 'from-sky-400 to-sky-600',
    border: 'border-sky-500/40',
  },
  {
    name: 'Bybit',
    desc: '단기 트레이딩 · 빠른 반응성',
    href: '/ko/referrals/bybit',
    accent: 'from-orange-400 to-orange-600',
    border: 'border-orange-500/40',
  },
  {
    name: 'Bitget',
    desc: '카피 트레이딩 · 보조 전략용',
    href: '/ko/referrals/bitget',
    accent: 'from-emerald-400 to-emerald-600',
    border: 'border-emerald-500/40',
  },
]

export default function ReferralsPage() {
  const handleClick = useCallback(() => {
    new Audio('/sounds/click-soft.mp3').play().catch(() => {})
    navigator.vibrate?.(8)
  }, [])

  return (
    <div className={clsx(inter.className, 'space-y-12')}>
      {/* Header */}
      <header className="space-y-3">
        <h1
          className={clsx(
            playfair.className,
            'text-4xl md:text-5xl font-semibold tracking-tight text-slate-100'
          )}
        >
          Professional Trading Infrastructure
        </h1>
        <p className="text-base md:text-lg text-slate-400 max-w-2xl">
          실제 트레이더 기준으로 검증된 거래 환경 목록입니다.
        </p>
      </header>

      {/* Exchange Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {exchanges.map((ex) => (
          <Link
            key={ex.name}
            href={ex.href}
            onClick={handleClick}
            className={clsx(
              'group relative overflow-hidden rounded-xl',
              'bg-vipCard border',
              ex.border,
              'px-6 py-6',
              'transition-all duration-200',
              'hover:-translate-y-[2px] hover:border-opacity-70'
            )}
          >
            {/* Accent Line */}
            <div
              className={clsx(
                'absolute top-0 left-0 h-[2px] w-full',
                `bg-gradient-to-r ${ex.accent}`
              )}
            />

            <div className="relative z-10 space-y-1.5">
              <h2 className="text-base font-semibold text-slate-100 tracking-wide">
                {ex.name}
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                {ex.desc}
              </p>
            </div>
          </Link>
        ))}
      </section>
    </div>
  )
}
