import { useVIPMarketStore } from '@/lib/market/store/vipMarketStore'

/* =========================================================
OI / Funding Narrative Signal
Cause Layer Interpreter
========================================================= */

export interface OIFundingSignal {
  oiFundingSignals: string[]
}

/* =========================================================
Threshold
========================================================= */

const OI_STRONG_INCREASE = 0.002
const OI_STRONG_DECREASE = -0.002

/* =========================================================
Interpret OI + Funding
OI / Funding → Cause Narrative Signals
========================================================= */

export function interpretOIFunding(): OIFundingSignal {

  const market = useVIPMarketStore.getState()

  const signals: string[] = []

  const oiDelta = market.oiDelta ?? 0
  const funding = market.fundingBias

  /* =========================================================
  OI 감소 + LONG 과열 → 롱 청산 위험
  ========================================================= */

  if (oiDelta < OI_STRONG_DECREASE && funding === 'LONG_HEAVY') {

    signals.push(
      'OI 감소와 Funding Rate 약화가 나타나며 롱 포지션 정리가 진행되고'
    )
  }

  /* =========================================================
  OI 증가 + SHORT 과열 → 숏 압력 증가
  ========================================================= */

  if (oiDelta > OI_STRONG_INCREASE && funding === 'SHORT_HEAVY') {

    signals.push(
      'OI 증가와 함께 숏 포지션 압력이 확대되며'
    )
  }

  /* =========================================================
  OI 증가 + LONG 과열 → 레버리지 확장
  ========================================================= */

  if (oiDelta > OI_STRONG_INCREASE && funding === 'LONG_HEAVY') {

    signals.push(
      'OI 증가와 Funding Rate 상승이 나타나며 레버리지 확장이 진행되고'
    )
  }

  /* =========================================================
  OI 감소 → 포지션 정리
  ========================================================= */

  if (oiDelta < OI_STRONG_DECREASE && funding === 'NEUTRAL') {

    signals.push(
      'OI 감소 흐름이 나타나며 시장 포지션 정리가 진행되고'
    )
  }

  /* =========================================================
  OI 증가 → 신규 포지션 유입
  ========================================================= */

  if (oiDelta > OI_STRONG_INCREASE && funding === 'NEUTRAL') {

    signals.push(
      'OI 증가와 함께 신규 포지션 유입이 나타나며'
    )
  }

  return {
    oiFundingSignals: signals
  }
}
