"use client";

import { useEffect } from "react";

export function useProfitEffects(pnl: number) {
  useEffect(() => {
    if (pnl > 500) {
      new Audio("/sounds/jackpot.mp3").play();
    } else if (pnl > 100) {
      new Audio("/sounds/high.mp3").play();
    }
  }, [pnl]);
}
