'use client';

import { createContext, useContext } from 'react';
import type { VIPLevel } from './vipAccess';

const Ctx = createContext<{
  vipLevel: VIPLevel;
  extremeForced: boolean;
} | null>(null);

export function VIPLevelProvider({
  vipLevel,
  extremeForced,
  children,
}: {
  vipLevel: VIPLevel;
  extremeForced: boolean;
  children: React.ReactNode;
}) {
  return (
    <Ctx.Provider value={{ vipLevel, extremeForced }}>
      {children}
    </Ctx.Provider>
  );
}

export function useVIPLevel() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('VIPLevelProvider missing');
  return ctx;
}
