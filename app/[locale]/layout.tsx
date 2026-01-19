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
  const bootstrapAlertsSSE = useAlertsSSEStore((s) => s.bootstrap)

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
