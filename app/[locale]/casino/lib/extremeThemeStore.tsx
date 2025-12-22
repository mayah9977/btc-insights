'use client';

import { createContext, useContext, useMemo } from 'react';
import { useVIPLevel } from './vipLevelStore';

const Ctx = createContext<{
  extreme: boolean;
} | null>(null);

export function ExtremeThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { extremeForced } = useVIPLevel();

  const value = useMemo(
    () => ({
      extreme: extremeForced, // 🔥 서버 강제 우선
    }),
    [extremeForced]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useExtremeTheme() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('ExtremeThemeProvider missing');
  return ctx;
}
