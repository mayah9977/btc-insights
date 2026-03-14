import { useVIPMarketStore } from '@/lib/market/store/vipMarketStore'

/* =========================================================
Position Pressure Signal Type
========================================================= */

export type PositionPressureSignalType =
  | 'LONG_LIQUIDATION_PRESSURE'
  | 'SHORT_LIQUIDATION_PRESSURE'
  | 'LONG_BUILDUP'
  | 'SHORT_BUILDUP'
  | 'SQUEEZE_RISK'

/* =========================================================
Position Pressure Result
========================================================= */

export interface PositionPressureSignal {
  pressureSignals: string[]
}

/* =========================================================
Threshold Config
시장 민감도 설정
========================================================= */

const OI_INCREASE_THRESHOLD = 0
const OI_DECREASE_THRESHOLD = 0

const VOLUME_SURGE_THRESHOLD = 1.3

const WHALE_STRONG_BUY = 0.1
const WHALE_STRONG_SELL = -0.1

/* =========================================================
Interpret Position Pressure
========================================================= */

export function interpretPositionPressure(): PositionPressureSignal {

  const market = useVIPMarketStore.getState()

  const pressureSignals: string[] = []

  const {
    oiDelta,
    volumeRatio,
    fundingBias,
    whaleNetRatio
  } = market

  /* =========================================================
  LONG Liquidation Pressure
  조건
  OI 감소 + Volume 급증 + LONG_HEAVY
  ========================================================= */

  if (
    oiDelta < OI_DECREASE_THRESHOLD &&
    volumeRatio > VOLUME_SURGE_THRESHOLD &&
    fundingBias === 'LONG_HEAVY'
  ) {
    pressureSignals.push(
      '롱 포지션 청산 압력이 증가하고'
    )
  }

  /* =========================================================
  SHORT Liquidation Pressure
  조건
  OI 감소 + Volume 급증 + SHORT_HEAVY
  ========================================================= */

  if (
    oiDelta < OI_DECREASE_THRESHOLD &&
    volumeRatio > VOLUME_SURGE_THRESHOLD &&
    fundingBias === 'SHORT_HEAVY'
  ) {
    pressureSignals.push(
      '숏 포지션 청산이 발생하며 시장 반등 압력이 형성되고'
    )
  }

  /* =========================================================
  LONG Position Build-up
  조건
  OI 증가 + LONG_HEAVY
  ========================================================= */

  if (
    oiDelta > OI_INCREASE_THRESHOLD &&
    fundingBias === 'LONG_HEAVY'
  ) {
    pressureSignals.push(
      '롱 포지션이 빠르게 증가하며 시장 레버리지 위험이 확대되고'
    )
  }

  /* =========================================================
  SHORT Position Build-up
  조건
  OI 증가 + SHORT_HEAVY
  ========================================================= */

  if (
    oiDelta > OI_INCREASE_THRESHOLD &&
    fundingBias === 'SHORT_HEAVY'
  ) {
    pressureSignals.push(
      '숏 포지션이 증가하며 하락 압력이 강화되고'
    )
  }

  /* =========================================================
  Squeeze Risk Detection
  고래 포지션 + OI 증가
  ========================================================= */

  if (
    oiDelta > 0 &&
    Math.abs(whaleNetRatio) > 0.1
  ) {
    pressureSignals.push(
      '대규모 포지션 압력이 형성되며 숏 또는 롱 스퀴즈 가능성이 높아지고'
    )
  }

  return {
    pressureSignals,
  }
}
