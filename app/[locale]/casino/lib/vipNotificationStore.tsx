'use client';

import {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
} from 'react';

export type VIPNotification = {
  id: string;
  message: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  ts: number;
  symbol?: string; // ✅ 포커스용 (오류 해결 핵심)
};

type Ctx = {
  queue: VIPNotification[];
  push: (n: VIPNotification) => void;
  pop: () => void;
};

const VIPNotificationContext = createContext<Ctx | undefined>(undefined);

export function VIPNotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queue, setQueue] = useState<VIPNotification[]>([]);

  const push = useCallback((n: VIPNotification) => {
    setQueue((prev) =>
      [...prev, n]
        .sort(
          (a, b) =>
            (a.priority === 'HIGH' ? 3 : a.priority === 'MEDIUM' ? 2 : 1) -
            (b.priority === 'HIGH' ? 3 : b.priority === 'MEDIUM' ? 2 : 1)
        )
        .reverse()
    );
  }, []);

  const pop = useCallback(() => {
    setQueue((prev) => prev.slice(1));
  }, []);

  const value = useMemo(() => ({ queue, push, pop }), [queue, push, pop]);

  return (
    <VIPNotificationContext.Provider value={value}>
      {children}
    </VIPNotificationContext.Provider>
  );
}

export function useVIPNotification() {
  const ctx = useContext(VIPNotificationContext);
  if (!ctx)
    throw new Error('useVIPNotification must be used inside provider');
  return ctx;
}
