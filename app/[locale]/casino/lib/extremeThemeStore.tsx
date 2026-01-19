'use client'

import { createContext, useContext, useMemo } from 'react'
import { useVIP } from '@/lib/vip/vipClient'

const Ctx = createContext<{
  extreme: boolean
} | null>(null)

export function ExtremeThemeProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { vipLevel } = useVIP()

  const value = useMemo(
    () => ({
      // 🔥 VIP3 이상일 때만 Extreme 테마 허용
      extreme: vipLevel === 'VIP3',
    }),
    [vipLevel]
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useExtremeTheme() {
  const ctx = useContext(Ctx)
  if (!ctx) {
    throw new Error('ExtremeThemeProvider missing')
  }
  return ctx
}
