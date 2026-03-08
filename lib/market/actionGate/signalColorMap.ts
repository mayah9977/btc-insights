/**
 * Signal Color Map (UI Theme SSOT)
 *
 * 목적:
 * BollingerSignalType → UI Theme Color Mapping
 *
 * 원칙
 * - 계산 ❌
 * - 판단 ❌
 * - 로직 ❌
 *
 * UI 색상 매핑만 담당
 */

import { BollingerSignalType } from './signalType'

/* =========================================================
   Theme Shape
========================================================= */

export interface SignalTheme {
  accent: string
  glow: string
  text: string
}

/* =========================================================
   Upper Band (Overheat / Greed)
   Gold Theme
========================================================= */

const GOLD: SignalTheme = {
  accent: 'rgba(251,191,36,0.55)',
  glow: 'rgba(251,191,36,0.45)',
  text: '#facc15',
}

/* =========================================================
   Lower Band (Fear / Liquidation)
   Red Theme
========================================================= */

const RED: SignalTheme = {
  accent: 'rgba(239,68,68,0.55)',
  glow: 'rgba(239,68,68,0.45)',
  text: '#ef4444',
}

/* =========================================================
   Center (Neutral / Accumulation)
   Emerald Theme
========================================================= */

const EMERALD: SignalTheme = {
  accent: 'rgba(16,185,129,0.55)',
  glow: 'rgba(16,185,129,0.45)',
  text: '#10b981',
}

/* =========================================================
   🔒 Signal → Theme Mapping
========================================================= */

export const SIGNAL_COLOR_MAP: Record<
  BollingerSignalType,
  SignalTheme
> = {

  /* =====================================================
     Upper Band
  ===================================================== */

  [BollingerSignalType.INSIDE_UPPER_TOUCH]: GOLD,

  [BollingerSignalType.INSIDE_UPPER_CLOSE_ABOVE]: GOLD,

  [BollingerSignalType.INSIDE_UPPER_BREAK_AND_DEVIATE]: GOLD,

  [BollingerSignalType.OUTSIDE_UPPER_RETRACE_OVER_UPPER]: GOLD,

  [BollingerSignalType.OUTSIDE_UPPER_RETURN_INSIDE]: GOLD,


  /* =====================================================
     Lower Band
  ===================================================== */

  [BollingerSignalType.INSIDE_LOWER_TOUCH_OR_BREAK]: RED,

  [BollingerSignalType.INSIDE_LOWER_TOUCH_AND_REBOUND]: RED,

  [BollingerSignalType.INSIDE_LOWER_CLOSE_BELOW]: RED,

  [BollingerSignalType.INSIDE_LOWER_BREAK_AND_DEVIATE]: RED,

  [BollingerSignalType.OUTSIDE_LOWER_CROSS_UP_OVER_LOWER]: RED,

  [BollingerSignalType.OUTSIDE_LOWER_RETURN_INSIDE]: RED,


  /* =====================================================
     Center
  ===================================================== */

  [BollingerSignalType.INSIDE_CENTER]: EMERALD,
}

/* =========================================================
   Helper
========================================================= */

export function getSignalTheme(
  type?: BollingerSignalType
): SignalTheme {

  if (!type)
    return EMERALD

  return (
    SIGNAL_COLOR_MAP[type] ??
    EMERALD
  )
}
