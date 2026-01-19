'use client'

import { createContext, useContext } from 'react'
import type { VIPLevel, VIPAddon } from './vipTypes'

/* =========================
   Context Type
========================= */
export type VIPContextType = {
  vipLevel: VIPLevel
  setVipLevel: (level: VIPLevel) => void
  addons?: {
    [key in VIPAddon]?: number
  }
}

/**
 * ⚠️ 개발/검증 단계용 기본값
 * - 실제 서비스에서는 Provider로 반드시 주입
 * - DEV 환경에서 VIP 화면 확인을 위함
 */
const DEV_FALLBACK_CONTEXT: VIPContextType = {
  vipLevel: 'VIP1',
  setVipLevel: () => {},
  addons: {},
}

/**
 * Context
 * - null 허용 (Provider 강제 구조 유지)
 */
const VIPContext = createContext<VIPContextType | null>(null)

/* =========================
   Provider Props
========================= */
export type VIPProviderProps = {
  vipLevel: VIPLevel
  setVipLevel: (level: VIPLevel) => void
  addons?: {
    [key in VIPAddon]?: number
  }
  children: React.ReactNode
}

/* =========================
   Provider
========================= */
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

/* =========================
   Hook
========================= */
export function useVIP(): VIPContextType {
  const ctx = useContext(VIPContext)

  /**
   * ✅ Provider 없을 때 (DEV / 프리뷰 / 단독 페이지)
   * → VIP 화면 확인 가능
   */
  if (!ctx) {
    return DEV_FALLBACK_CONTEXT
  }

  return ctx
}
