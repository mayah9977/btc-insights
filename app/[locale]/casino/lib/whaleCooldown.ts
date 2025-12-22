'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * 고래 강도 기반 쿨다운 곡선
 * weight: 0 ~ 1
 */
export function calcWhaleCooldown(
  weight: number,
  extreme: boolean
): number {
  // 기본 5초
  const base = 5000;

  // 고래 강도 곡선 (비선형)
  // weight 높을수록 급격히 증가
  const curve = Math.pow(weight, 1.5);
  const extra = Math.min(25000, curve * 25000);

  let cooldown = base + extra;

  // 🔥 EXTREME MODE 단축 (40%)
  if (extreme) {
    cooldown *= 0.6;
  }

  return Math.round(cooldown);
}

/**
 * ENTRY Cooldown Hook
 */
export function useWhaleCooldown(symbol: string) {
  const [cooldownMs, setCooldownMs] = useState(0);
  const [remainingMs, setRemainingMs] = useState(0);
  const timerRef = useRef<number | null>(null);

  const triggerCooldown = (
    weight: number,
    extreme: boolean
  ) => {
    const duration = calcWhaleCooldown(weight, extreme);
    setCooldownMs(duration);
    setRemainingMs(duration);

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const start = Date.now();
    timerRef.current = window.setInterval(() => {
      const left = duration - (Date.now() - start);
      setRemainingMs(Math.max(0, left));

      if (left <= 0 && timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }, 100);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [symbol]);

  return {
    cooldownMs,
    remainingMs,
    triggerCooldown,
  };
}
