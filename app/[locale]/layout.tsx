//app/[locale]/layout.tsx

'use client'

import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { motion, type Transition } from 'framer-motion'

import LocaleClientBootstrap from './LocaleClientBootstrap'
import HeaderNotificationBell from './components/HeaderNotificationBell'

const EASE = [0.22, 1, 0.36, 1] as const

const HEADER_TRANSITION: Transition = {
  duration: 0.38,
  ease: EASE,
}

const SHIMMER_TRANSITION: Transition = {
  duration: 0.85,
  ease: EASE,
}

function getLocaleFromPathname(pathname: string) {
  const segments = pathname.split('/').filter(Boolean)
  return segments[0] ?? 'ko'
}

function getMarketBasePath(pathname: string, locale: string) {
  const marketBase = `/${locale}/market`
  const casinoBase = `/${locale}/casino`

  if (
    pathname === marketBase ||
    pathname.startsWith(`${marketBase}/`)
  ) {
    return marketBase
  }

  if (
    pathname === casinoBase ||
    pathname.startsWith(`${casinoBase}/`)
  ) {
    return casinoBase
  }

  return casinoBase
}

/* ========================= Header ========================= */
function AppHeader() {
  const router = useRouter()
  const pathname = usePathname()

  const locale = useMemo(() => getLocaleFromPathname(pathname), [pathname])
  const basePath = useMemo(
    () => getMarketBasePath(pathname, locale),
    [pathname, locale],
  )

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b border-white/10 bg-black/80 px-4 backdrop-blur">
      <motion.button
        onClick={() => router.push(basePath)}
        initial={{ opacity: 0, y: -8, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={HEADER_TRANSITION}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="relative isolate"
      >
        <span
          className="
            absolute inset-0 -z-10
            rounded-md
            bg-gradient-to-r from-amber-300/0 via-amber-200/22 to-orange-300/0
            blur-[8px] opacity-90
            pointer-events-none
          "
        />

        <motion.span
          aria-hidden
          initial={{ x: '-130%', opacity: 0 }}
          whileHover={{ x: '130%', opacity: 1 }}
          transition={SHIMMER_TRANSITION}
          className="
            absolute inset-y-0 left-0 z-10 w-12
            skew-x-[-20deg]
            bg-gradient-to-r from-transparent via-white/30 to-transparent
            pointer-events-none
          "
        />

        <span
          className="
            relative z-0
            font-black tracking-[0.22em]
            text-[18px] md:text-[24px]
            leading-none
            uppercase
            text-transparent bg-clip-text
            bg-gradient-to-r from-[#FFF4C2] via-[#F6C56B] to-[#E98A5B]
            [font-family:var(--font-space-grotesk),var(--font-sora),var(--font-inter-tight),sans-serif]
            drop-shadow-[0_1px_0_rgba(255,248,220,0.10)]
            transition duration-300
            select-none
            whitespace-nowrap
          "
        >
          THE WHALES
        </span>

        <span
          className="
            absolute inset-0 -z-10
            rounded-md
            opacity-0 transition duration-300
            bg-gradient-to-r from-amber-400/0 via-yellow-200/10 to-orange-400/0
            group-hover:opacity-100
            pointer-events-none
          "
        />
      </motion.button>

      <div className="flex items-center gap-3">
        <div
          className="cursor-pointer"
          onClick={() => router.push(`/${locale}/notifications`)}
          role="button"
          aria-label="notifications"
        >
          <HeaderNotificationBell />
        </div>

        <button
          type="button"
          onClick={() => router.push(`/${locale}/notices`)}
          className="text-sm opacity-80 transition hover:opacity-100"
          aria-label="notices"
        >
          🔍
        </button>
      </div>
    </header>
  )
}

/* ========================= Bottom Tab ========================= */
function BottomTab() {
  const router = useRouter()
  const pathname = usePathname()

  const locale = useMemo(() => getLocaleFromPathname(pathname), [pathname])
  const basePath = useMemo(
    () => getMarketBasePath(pathname, locale),
    [pathname, locale],
  )

  const cleanPath =
    pathname !== '/' && pathname.endsWith('/')
      ? pathname.slice(0, -1)
      : pathname

  const tabs = [
    { label: 'Home', path: basePath },
    { label: 'VIP', path: `${basePath}/vip` },
    { label: 'VIP Login', path: `/${locale}/vip-login` },
    { label: 'Alerts', path: `/${locale}/alerts` },
    { label: 'Ref', path: `/${locale}/referrals` },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 grid h-14 grid-cols-5 border-t border-white/10 bg-black/90 backdrop-blur">
      {tabs.map(tab => {
        const isHome = tab.path === basePath
        const isVIP = tab.path === `${basePath}/vip`
        const isVIPLogin = tab.path === `/${locale}/vip-login`

        const active =
          (isHome && cleanPath === basePath) ||
          (isVIP && cleanPath.startsWith(`${basePath}/vip`)) ||
          (isVIPLogin && cleanPath === `/${locale}/vip-login`) ||
          (!isHome && !isVIP && !isVIPLogin && cleanPath.startsWith(tab.path))

        const icon =
          tab.label === 'Home'
            ? '🏠'
            : tab.label === 'VIP'
            ? '💎'
            : tab.label === 'VIP Login'
            ? '🔐'
            : tab.label === 'Alerts'
            ? '🔔'
            : '💰'

        return (
          <button
            key={tab.path}
            onClick={() => {
              navigator.vibrate?.(8)
              router.push(tab.path)
            }}
            className={`flex flex-col items-center justify-center gap-[2px] text-xs transition-all duration-150 active:scale-95 ${
              active ? 'scale-105 font-semibold text-white' : 'text-gray-400'
            }`}
          >
            <span className="text-[16px] leading-none">
              {icon}
            </span>

            <span className="leading-none">
              {tab.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}

/* ========================= Layout ========================= */
export default function LocaleLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <>
      <LocaleClientBootstrap />

      <AppHeader />

      <main className="pt-0 pb-20 md:pt-[53px]">
        {children}
      </main>

      <BottomTab />
    </>
  )
}
