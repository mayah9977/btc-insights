'use client'

import type { ReactNode } from 'react'
import { useEffect } from 'react'

import Header from '@/components/common/header'
import { useAlertsSSEStore } from '@/lib/alerts/alertsSSEStore'

export default function LocaleLayout({
  children,
}: {
  children: ReactNode
}) {
  /**
   * 🔑 ALERTS SSE bootstrap
   * --------------------------------------------------
   * - locale layout 생명주기 기준 1회 실행
   * - StrictMode / Fast Refresh 안전
   * - SSE singleton store와 결합하여 중복 방지
   */
  const bootstrapAlertsSSE = useAlertsSSEStore(s => s.bootstrap)

  useEffect(() => {
    bootstrapAlertsSSE()
  }, [bootstrapAlertsSSE])

  return (
    <>
      <Header />

      <main className="pt-14">
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-10">
          {children}
        </div>
      </main>
    </>
  )
}
