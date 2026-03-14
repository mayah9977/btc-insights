import { useVIPMarketStore } from '@/lib/market/store/vipMarketStore'

/* =========================================================
Liquidation Map Result
========================================================= */

export interface LiquidationMapResult {
  longLiquidationZone: boolean
  shortLiquidationZone: boolean
  longSqueezeRisk: boolean
  shortSqueezeRisk: boolean
  liquidationSignals: string[]
}

/* =========================================================
Threshold Config
시장 민감도 조정
========================================================= */

const VOLUME_LIQUIDATION_THRESHOLD = 1.35
const WHALE_STRONG_THRESHOLD = 0.1
const OI_DROP_THRESHOLD = -0.001
const OI_RISE_THRESHOLD = 0.001

/* =========================================================
Interpret Liquidation Map
========================================================= */

export function interpretLiquidationMap(): LiquidationMapResult {

  const market = useVIPMarketStore.getState()

  const {
    oiDelta,
    volumeRatio,
    fundingBias,
    whaleNetRatio
  } = market

  let longLiquidationZone = false
  let shortLiquidationZone = false
  let longSqueezeRisk = false
  let shortSqueezeRisk = false

  const liquidationSignals: string[] = []

  /* =========================================================
  LONG Liquidation Zone
  조건
  OI 감소 + Volume 증가 + LONG_HEAVY
  ========================================================= */

  if (
    oiDelta < OI_DROP_THRESHOLD &&
    volumeRatio > VOLUME_LIQUIDATION_THRESHOLD &&
    fundingBias === 'LONG_HEAVY'
  ) {

    longLiquidationZone = true

    liquidationSignals.push(
      '롱 포지션 청산 클러스터 구간에 접근하고'
    )
  }

  /* =========================================================
  SHORT Liquidation Zone
  조건
  OI 감소 + Volume 증가 + SHORT_HEAVY
  ========================================================= */

  if (
    oiDelta < OI_DROP_THRESHOLD &&
    volumeRatio > VOLUME_LIQUIDATION_THRESHOLD &&
    fundingBias === 'SHORT_HEAVY'
  ) {

    shortLiquidationZone = true

    liquidationSignals.push(
      '숏 포지션 청산이 발생하며 반등 압력이 형성되고'
    )
  }

  /* =========================================================
  LONG Squeeze Risk
  조건
  OI 증가 + Whale 강한 매수
  ========================================================= */

  if (
    oiDelta > OI_RISE_THRESHOLD &&
    whaleNetRatio > WHALE_STRONG_THRESHOLD
  ) {

    shortSqueezeRisk = true

    liquidationSignals.push(
      '숏 스퀴즈 가능성이 높아지고'
    )
  }

  /* =========================================================
  SHORT Squeeze Risk
  조건
  OI 증가 + Whale 강한 매도
  ========================================================= */

  if (
    oiDelta > OI_RISE_THRESHOLD &&
    whaleNetRatio < -WHALE_STRONG_THRESHOLD
  ) {

    longSqueezeRisk = true

    liquidationSignals.push(
      '롱 포지션 청산 가능성이 높아지고'
    )
  }

  /* =========================================================
  High Volatility Liquidation Cluster
  ========================================================= */

  if (
    volumeRatio > 1.6 &&
    Math.abs(oiDelta) > 0.001
  ) {

    liquidationSignals.push(
      '대규모 청산 클러스터가 형성될 가능성이 있어'
    )
  }

  return {
    longLiquidationZone,
    shortLiquidationZone,
    longSqueezeRisk,
    shortSqueezeRisk,
    liquidationSignals
  }
}
