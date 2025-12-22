"use client";

import React, { createContext, useContext, useMemo, useState, useCallback } from "react";

type WhaleEvent = {
  ts: number;
  intensity: "LOW" | "MEDIUM" | "HIGH";
};

type WhaleFrequencyContextType = {
  events: WhaleEvent[];
  pushEvent: (e: WhaleEvent) => void;

  // 시간 가중치(최근일수록 큰 값)
  getWeight: () => number;
};

const WhaleFrequencyContext = createContext<WhaleFrequencyContextType | undefined>(undefined);

export function WhaleFrequencyProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<WhaleEvent[]>([]);

  const pushEvent = useCallback((e: WhaleEvent) => {
    setEvents((prev) => {
      const next = [e, ...prev].slice(0, 200); // 상한
      return next;
    });
  }, []);

  const getWeight = useCallback(() => {
    const now = Date.now();

    // half-life 5분: 5분 지나면 영향력 절반
    const halfLifeMs = 5 * 60 * 1000;
    const lambda = Math.log(2) / halfLifeMs;

    let w = 0;
    for (const ev of events) {
      const dt = now - ev.ts;
      const decay = Math.exp(-lambda * dt);

      // HIGH는 더 큰 가중치
      const k = ev.intensity === "HIGH" ? 1.0 : ev.intensity === "MEDIUM" ? 0.5 : 0.2;
      w += k * decay;
    }
    return w;
  }, [events]);

  const value = useMemo(
    () => ({ events, pushEvent, getWeight }),
    [events, pushEvent, getWeight]
  );

  return <WhaleFrequencyContext.Provider value={value}>{children}</WhaleFrequencyContext.Provider>;
}

export function useWhaleFrequency() {
  const ctx = useContext(WhaleFrequencyContext);
  if (!ctx) throw new Error("useWhaleFrequency must be used inside WhaleFrequencyProvider");
  return ctx;
}
