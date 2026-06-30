'use client';

import { createContext, useContext, useState } from 'react';

export type DangerLog = {
  symbol: string;
  probability: number;
  ts: number;
};

const Ctx = createContext<{
  logs: DangerLog[];
  push: (l: DangerLog) => void;
} | null>(null);

export function DangerZoneLogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [logs, setLogs] = useState<DangerLog[]>([]);

  const push = (l: DangerLog) =>
    setLogs((prev) => [l, ...prev].slice(0, 200));

  return (
    <Ctx.Provider value={{ logs, push }}>
      {children}
    </Ctx.Provider>
  );
}

export function useDangerZoneLog() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('DangerZoneLogProvider missing');
  return ctx;
}
