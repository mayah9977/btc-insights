import { useVIPMarketStore } from '@/lib/market/store/vipMarketStore'

/* =========================================================
Market Structure Signal Type
========================================================= */

export interface MarketStructureSignal {
  trends: string[]
  structureSignals: string[]
}

/* =========================================================
Threshold Config
시장 민감도 조정 가능
========================================================= */

const OI_ACCUMULATION_THRESHOLD = 0
const WHALE_ACCUMULATION_THRESHOLD = 0.05

const VOLUME_SPIKE_THRESHOLD = 1.3
const VOLUME_DROP_THRESHOLD = 0.8

const LIQUIDATION_VOLUME_THRESHOLD = 1.4

const WHALE_AGGRESSIVE_THRESHOLD = 0.1

/* =========================================================
Interpret Market Structure
marketState → 시장 구조 해석 → narrative signals
========================================================= */

export function interpretMarketStructure(): MarketStructureSignal {

  const market = useVIPMarketStore.getState()

  const trends: string[] = []
  const structureSignals: string[] = []

  const oiDelta = market.oiDelta ?? 0
  const volumeRatio = market.volumeRatio ?? 1
  const whaleNet = market.whaleNetRatio ?? 0
  const funding = market.fundingBias

  /* =========================================================
  OI Direction
  ========================================================= */

  if (oiDelta > 0) {
    trends.push('OI 증가')
    structureSignals.push(
      'OI 증가 흐름이 나타나며 시장 레버리지 확장이 진행되고'
    )
  }

  if (oiDelta < 0) {
    trends.push('OI 감소')
    structureSignals.push(
      'OI 감소 흐름이 나타나며 포지션 정리가 진행되고'
    )
  }

  /* =========================================================
  Volume
  ========================================================= */

  if (volumeRatio > VOLUME_SPIKE_THRESHOLD) {
    trends.push('거래량 급증')
    structureSignals.push(
      '거래량 급증과 함께 시장 변동성이 확대되고'
    )
  }

  if (volumeRatio < VOLUME_DROP_THRESHOLD) {
    trends.push('거래량 감소')
    structureSignals.push(
      '거래량 감소와 함께 시장 에너지가 축적되고'
    )
  }

  /* =========================================================
  Whale Flow
  ========================================================= */

  if (whaleNet > 0.05) {
    trends.push('고래 매수 우세')
  }

  if (whaleNet < -0.05) {
    trends.push('고래 매도 우세')
  }

  /* =========================================================
  Funding Bias
  ========================================================= */

  if (funding === 'LONG_HEAVY') {
    trends.push('롱 포지션 과열')
    structureSignals.push(
      'Funding Rate 상승과 함께 롱 포지션 과열 압력이 나타나고'
    )
  }

  if (funding === 'SHORT_HEAVY') {
    trends.push('숏 포지션 과열')
    structureSignals.push(
      'Funding Rate 하락과 함께 숏 포지션 압력이 확대되고'
    )
  }

  /* =========================================================
  Institutional Accumulation
  OI + WhaleNet
  ========================================================= */

  if (
    oiDelta > OI_ACCUMULATION_THRESHOLD &&
    whaleNet > WHALE_ACCUMULATION_THRESHOLD
  ) {
    structureSignals.push(
      '기관 매집 흐름이 감지되고'
    )
  }

  /* =========================================================
  Long Overheating
  OI + Funding
  ========================================================= */

  if (
    oiDelta > 0 &&
    funding === 'LONG_HEAVY'
  ) {
    structureSignals.push(
      '롱 포지션 과열 구간이 형성되고'
    )
  }

  /* =========================================================
  Short Overheating
  ========================================================= */

  if (
    oiDelta > 0 &&
    funding === 'SHORT_HEAVY'
  ) {
    structureSignals.push(
      '숏 포지션 과열 구간이 형성되고'
    )
  }

  /* =========================================================
  Liquidation Detection
  OI 감소 + 거래량 급증
  ========================================================= */

  if (
    oiDelta < 0 &&
    volumeRatio > LIQUIDATION_VOLUME_THRESHOLD
  ) {
    structureSignals.push(
      '대규모 청산 흐름이 발생하고'
    )
  }

  /* =========================================================
  Whale Aggressive Selling
  ========================================================= */

  if (
    whaleNet < -WHALE_AGGRESSIVE_THRESHOLD &&
    volumeRatio > 1.2
  ) {
    structureSignals.push(
      '고래 매도 압력이 시장 하락을 주도하고'
    )
  }

  /* =========================================================
  Whale Aggressive Buying
  ========================================================= */

  if (
    whaleNet > WHALE_AGGRESSIVE_THRESHOLD &&
    volumeRatio > 1.2
  ) {
    structureSignals.push(
      '고래 매수 압력이 시장 상승을 주도하고'
    )
  }

  /* =========================================================
  Whale Dominance
  ========================================================= */

  if (Math.abs(whaleNet) > WHALE_AGGRESSIVE_THRESHOLD) {

    if (whaleNet > 0) {
      structureSignals.push(
        '고래 매수 세력이 시장 방향성을 주도하기 시작하고'
      )
    }

    if (whaleNet < 0) {
      structureSignals.push(
        '고래 매도 세력이 시장 하락 흐름을 강화하고'
      )
    }
  }

  return {
    trends,
    structureSignals,
  }
}
