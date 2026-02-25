'use client'

import { useEffect, useState } from 'react'

/* =========================
 * Types
 * ========================= */
type Props = {
  children: React.ReactNode
}

/* =========================
 * Mobile Only Layout
 * - hidden 사용 ❌
 * - 조건부 렌더링 사용 ✅
 * - Recharts width(-1) 방지
 * ========================= */
export default function VIPMobileLayout({ children }: Props) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null)

  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth < 768)
    }

    check()
    window.addEventListener('resize', check)

    return () => {
      window.removeEventListener('resize', check)
    }
  }, [])

  // ✅ 초기 SSR mismatch 방지
  if (isMobile === null) return null

  if (!isMobile) return null

  return <div className="space-y-6">{children}</div>
}