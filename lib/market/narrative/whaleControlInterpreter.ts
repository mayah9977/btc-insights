import { useVIPMarketStore } from '@/lib/market/store/vipMarketStore'

/* =========================================================
Whale Control Signal Type
========================================================= */

export interface WhaleControlSignal {
  whaleSignals: string[]
}

/* =========================================================
Threshold Config
시장 민감도 조정 가능
========================================================= */

const WHALE_BUY_THRESHOLD = 0.05
const WHALE_SELL_THRESHOLD = -0.05

const WHALE_DOMINANT_THRESHOLD = 0.1

const VOLUME_CONFIRM_THRESHOLD = 1.2

/* =========================================================
Interpret Whale Market Control
whaleNetRatio + volumeRatio + oiDelta
→ whale market control signals
========================================================= */

export function interpretWhaleControl(): WhaleControlSignal {

  const market = useVIPMarketStore.getState()

  const whaleSignals: string[] = []

  const whaleNet = market.whaleNetRatio ?? 0
  const volumeRatio = market.volumeRatio ?? 1
  const oiDelta = market.oiDelta ?? 0

  /* =========================================================
  Whale Buying Dominance
  고래 매수 주도
  ========================================================= */

  if (
    whaleNet > WHALE_DOMINANT_THRESHOLD &&
    volumeRatio > VOLUME_CONFIRM_THRESHOLD
  ) {
    whaleSignals.push(
      '고래 매수 세력이 시장 상승을 주도하고 있으며'
    )
  }

  /* =========================================================
  Whale Selling Dominance
  고래 매도 주도
  ========================================================= */

  if (
    whaleNet < -WHALE_DOMINANT_THRESHOLD &&
    volumeRatio > VOLUME_CONFIRM_THRESHOLD
  ) {
    whaleSignals.push(
      '고래 매도 세력이 시장 하락을 주도하고 있으며'
    )
  }

  /* =========================================================
  Whale Accumulation
  고래 매집
  ========================================================= */

  if (
    whaleNet > WHALE_BUY_THRESHOLD &&
    oiDelta > 0 &&
    volumeRatio <= VOLUME_CONFIRM_THRESHOLD
  ) {
    whaleSignals.push(
      '고래 매집 흐름이 형성되며 하락이 제한되는 움직임이 나타나고'
    )
  }

  /* =========================================================
  Whale Distribution
  고래 분배
  ========================================================= */

  if (
    whaleNet < WHALE_SELL_THRESHOLD &&
    oiDelta < 0 &&
    volumeRatio <= VOLUME_CONFIRM_THRESHOLD
  ) {
    whaleSignals.push(
      '고래 분배 흐름이 나타나며 상승 압력이 제한되는 움직임이 나타나고'
    )
  }

  /* =========================================================
  Whale Market Control Warning
  ========================================================= */

  if (
    Math.abs(whaleNet) > WHALE_DOMINANT_THRESHOLD &&
    volumeRatio < 1
  ) {
    whaleSignals.push(
      '고래 흐름이 시장 방향성에 영향을 주기 시작하고'
    )
  }

  return {
    whaleSignals,
  }
}
