'use client'

import type { ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'

import LocaleClientBootstrap from './LocaleClientBootstrap'

/* ========================= Header ========================= */
function AppHeader() {
const router = useRouter()

return (

<header className=" fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 bg-black/80 backdrop-blur border-b border-white/10 ">
<button onClick={() => router.push('/ko/casino')} className="font-bold tracking-wide">
THE WHALES
</button>

  <div className="flex items-center gap-3">
    <button className="text-sm opacity-80">🔔</button>
    <button className="text-sm opacity-80">🔍</button>
  </div>
</header>

)
}

/* ========================= Bottom Tab ========================= */
function BottomTab() {
const router = useRouter()
const pathname = usePathname()

// FIX: pathname 정규화 (trailing slash 제거)
const cleanPath = pathname !== '/' && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname

const tabs = [
{ label: 'Home', path: '/ko/casino' },
{ label: 'VIP', path: '/ko/casino/vip' },
{ label: 'Alerts', path: '/ko/alerts' },
{ label: 'Ref', path: '/ko/referrals' },
]

return (

<nav className=" fixed bottom-0 left-0 right-0 z-50 h-14 grid grid-cols-4 bg-black/90 backdrop-blur border-t border-white/10 ">
{tabs.map((tab) => {
const isHome = tab.path === '/ko/casino'
const isVIP = tab.path === '/ko/casino/vip'

// FIX: cleanPath 기준 active 판별
const active =
(isHome && cleanPath === '/ko/casino') ||
(isVIP && cleanPath.startsWith('/ko/casino/vip')) ||
(!isHome &&
!isVIP &&
cleanPath.startsWith(tab.path))

// FIX: 아이콘 매핑
const icon =
tab.label === 'Home'
? '🏠'
: tab.label === 'VIP'
? '💎'
: tab.label === 'Alerts'
? '🔔'
: '💰'

return (
<button
key={tab.path}
onClick={() => {
navigator.vibrate?.(8) // FIX: haptic feedback
router.push(tab.path)
}}
className={`text-xs flex flex-col items-center justify-center
transition-all duration-150 active:scale-95  // FIX: animation 개선
${active ? 'text-white font-semibold scale-105' : 'text-gray-400'} // FIX: active 강조`}

>

<span>{icon}</span> {/* FIX: 아이콘 추가 */} <span>{tab.label}</span> </button>
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
const pathname = usePathname()

return (
<> <LocaleClientBootstrap />

<AppHeader />

<main
className="
pt-0 md:pt-[53px]
pb-20
"
>
{children}
</main>

<BottomTab />
</>
)
}
