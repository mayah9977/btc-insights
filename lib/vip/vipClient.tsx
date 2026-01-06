'use client'

import { createContext, useContext } from 'react'
import type { VIPLevel, VIPAddon } from './vipTypes'

export type VIPContextType = {
  vipLevel: VIPLevel
  addons?: {
    [key in VIPAddon]?: number
  }
}

const VIPContext = createContext<VIPContextType | null>(null)

type VIPProviderProps = {
  vipLevel: VIPLevel
  addons?: {
    [key in VIPAddon]?: number
  }
  children: React.ReactNode
}

export function VIPProvider({
  vipLevel,
  addons,
  children,
}: VIPProviderProps) {
  return (
    <VIPContext.Provider value={{ vipLevel, addons }}>
      {children}
    </VIPContext.Provider>
  )
}

export function useVIP(): VIPContextType {
  const ctx = useContext(VIPContext)
  if (!ctx) {
    throw new Error('useVIP must be used within VIPProvider')
  }
  return ctx
}
