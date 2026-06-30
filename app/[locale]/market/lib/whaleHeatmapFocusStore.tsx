'use client';

import { createContext, useContext, useState } from 'react';

const Ctx = createContext<{
  symbol: string | null;
  setSymbol: (s: string | null) => void;
} | null>(null);

export function WhaleHeatmapFocusProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [symbol, setSymbol] = useState<string | null>(null);

  return (
    <Ctx.Provider value={{ symbol, setSymbol }}>
      {children}
    </Ctx.Provider>
  );
}

export function useWhaleHeatmapFocus() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('HeatmapFocusProvider missing');
  return ctx;
}
