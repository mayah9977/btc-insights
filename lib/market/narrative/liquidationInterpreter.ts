import { useVIPMarketStore } from '@/lib/market/store/vipMarketStore'

/* =========================================================
Liquidation Signal Type
========================================================= */

export interface LiquidationSignal {
  liquidationSignals: string[]
}

/* =========================================================
Threshold Config
시장 민감도 조정 가능
========================================================= */

const VOLUME_SPIKE_THRESHOLD = 1.35
const OI_DROP_THRESHOLD = -0.0001

/* =========================================================
Interpret Liquidation Map
oiDelta + volumeRatio + fundingBias → liquidation signals
========================================================= */

export function interpretLiquidation(): LiquidationSignal {

  const market = useVIPMarketStore.getState()

  const liquidationSignals: string[] = []

  const oiDelta = market.oiDelta ?? 0
  const volumeRatio = market.volumeRatio ?? 1
  const fundingBias = market.fundingBias

  /* =========================================================
  Long Liquidation
  OI 감소 + 거래량 급증
  ========================================================= */

  if (
    oiDelta < OI_DROP_THRESHOLD &&
    volumeRatio > VOLUME_SPIKE_THRESHOLD &&
    fundingBias === 'LONG_HEAVY'
  ) {
    liquidationSignals.push(
      '롱 포지션 청산이 발생하며 하락 압력이 확대되고'
    )
  }

  /* =========================================================
  Short Liquidation
  OI 감소 + 거래량 급증
  ========================================================= */

  if (
    oiDelta < OI_DROP_THRESHOLD &&
    volumeRatio > VOLUME_SPIKE_THRESHOLD &&
    fundingBias === 'SHORT_HEAVY'
  ) {
    liquidationSignals.push(
      '숏 포지션 청산이 발생하며 상승 압력이 확대되고'
    )
  }

  /* =========================================================
  Cascade Liquidation
  ========================================================= */

  if (
    oiDelta < OI_DROP_THRESHOLD &&
    volumeRatio > 1.6
  ) {
    liquidationSignals.push(
      '연쇄 청산이 발생하며 시장 변동성이 급격히 확대되고'
    )
  }

  /* =========================================================
  Early Liquidation Signal
  ========================================================= */

  if (
    oiDelta < 0 &&
    volumeRatio > 1.2
  ) {
    liquidationSignals.push(
      '청산 초기 신호가 나타나며 포지션 정리가 진행되고'
    )
  }

  return {
    liquidationSignals,
  }
}
