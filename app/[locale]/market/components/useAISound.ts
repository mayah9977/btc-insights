"use client";

import { useEffect, useRef } from "react";

export function useAISound(aiScore: number) {
  const playedRef = useRef(false);

  useEffect(() => {
    if (playedRef.current) return;

    if (aiScore >= 90) {
      new Audio("/sounds/jackpot.mp3").play();
      playedRef.current = true;
    } else if (aiScore >= 85) {
      new Audio("/sounds/high.mp3").play();
      playedRef.current = true;
    }
  }, [aiScore]);
}
