// lib/vip/vipClient.ts
'use client';

import { createContext, useContext } from 'react';
import { VIPLevel, VIPAddon } from './vipTypes';

/**
 * VIP Client Context Type
 * - UI에서 사용하는 단일 SSOT
 */
export type VIPContextType = {
  vipLevel: VIPLevel;

  /**
   * VIP Add-ons
   * - addonKey -> expireAt(timestamp)
   */
  addons?: {
    [key in VIPAddon]?: number;
  };
};

/**
 * Context
 */
const VIPContext = createContext<VIPContextType | null>(null);

/**
 * Provider
 */
export function VIPProvider({
  vipLevel,
  addons,
  children,
}: {
  vipLevel: VIPLevel;
  addons?: {
    [key in VIPAddon]?: number;
  };
  children: React.ReactNode;
}) {
  return (
    <VIPContext.Provider value={{ vipLevel, addons }}>
      {children}
    </VIPContext.Provider>
  );
}

/**
 * Hook
 */
export function useVIP(): VIPContextType {
  const ctx = useContext(VIPContext);
  if (!ctx) {
    throw new Error('useVIP must be used within VIPProvider');
  }
  return ctx;
}
