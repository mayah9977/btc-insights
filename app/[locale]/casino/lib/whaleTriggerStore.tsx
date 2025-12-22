"use client";

import React, { createContext, useContext, useMemo, useState, useCallback } from "react";

type WhaleTriggerContextType = {
  whaleActive: boolean;
  triggerWhale: (payload?: { intensity?: "LOW" | "MEDIUM" | "HIGH" }) => void;
};

const WhaleTriggerContext = createContext<WhaleTriggerContextType | undefined>(undefined);

export function WhaleTriggerProvider({ children }: { children: React.ReactNode }) {
  const [whaleActive, setWhaleActive] = useState(false);

  const triggerWhale = useCallback((_payload?: { intensity?: "LOW" | "MEDIUM" | "HIGH" }) => {
    setWhaleActive(true);

    // 자동 해제 6초
    window.setTimeout(() => {
      setWhaleActive(false);
    }, 6000);
  }, []);

  const value = useMemo(() => ({ whaleActive, triggerWhale }), [whaleActive, triggerWhale]);

  return <WhaleTriggerContext.Provider value={value}>{children}</WhaleTriggerContext.Provider>;
}

export function useWhaleTrigger() {
  const ctx = useContext(WhaleTriggerContext);
  if (!ctx) throw new Error("useWhaleTrigger must be used inside WhaleTriggerProvider");
  return ctx;
}
