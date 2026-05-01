// lib/vip/vipClient.tsx
'use client'

import { createContext, useContext } from 'react'
import type { VIPLevel, VIPAddon } from './vipTypes'

export type VIPContextType = {
  vipLevel: VIPLevel
  setVipLevel: (level: VIPLevel) => void
  addons?: {
    [key in VIPAddon]?: number
  }
}

const DEV_FALLBACK_CONTEXT: VIPContextType = {
  vipLevel: 'VIP',
  setVipLevel: () => {},
  addons: {},
}

const VIPContext = createContext<VIPContextType | null>(null)

export type VIPProviderProps = {
  vipLevel: VIPLevel
  setVipLevel: (level: VIPLevel) => void
  addons?: {
    [key in VIPAddon]?: number
  }
  children: React.ReactNode
}

export function VIPProvider({
  vipLevel,
  setVipLevel,
  addons,
  children,
}: VIPProviderProps) {
  return (
    <VIPContext.Provider value={{ vipLevel, setVipLevel, addons }}>
      {children}
    </VIPContext.Provider>
  )
}

export function useVIP(): VIPContextType {
  const ctx = useContext(VIPContext)

  if (!ctx) {
    return DEV_FALLBACK_CONTEXT
  }

  return ctx
}
