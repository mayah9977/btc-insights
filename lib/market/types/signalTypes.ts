/* =========================================================
 Unified Signal Types (FINAL)
 목적
 - 모든 interpreter 공통 신호 구조 통합
 - string 제거 → 구조화된 데이터
========================================================= */

/* =========================================================
 Signal Category
========================================================= */
export type SignalCategory =
  | 'structure'
  | 'pressure'
  | 'whale'
  | 'liquidation'
  | 'liquidation_map' // 🔥 추가
  | 'regime'

/* =========================================================
 Base Signal
========================================================= */
export interface BaseSignal {
  type: string
  category: SignalCategory

  /** 강도 (0 ~ 2 정도) */
  strength?: number

  /** 핵심 값 (예: oiDelta, volumeRatio 등) */
  value?: number

  /** 추가 메타 */
  meta?: Record<string, any>
}

/* =========================================================
 Structure Signal
========================================================= */
export interface StructureSignal extends BaseSignal {
  category: 'structure'

  type:
    | 'OI_INCREASE'
    | 'OI_DECREASE'
    | 'VOLUME_SPIKE'
    | 'VOLUME_DROP'
    | 'ACCUMULATION'
    | 'DISTRIBUTION'
}

/* =========================================================
 Pressure Signal
========================================================= */
export interface PressureSignal extends BaseSignal {
  category: 'pressure'

  type:
    | 'LONG_BUILDUP'
    | 'SHORT_BUILDUP'
    | 'LONG_OVERHEAT'
    | 'SHORT_OVERHEAT'
    | 'SQUEEZE_RISK'
    | 'LONG_LIQUIDATION_PRESSURE'  // 🔥 추가
    | 'SHORT_LIQUIDATION_PRESSURE' // 🔥 추가
}

/* =========================================================
 Whale Signal (🔥 확장)
========================================================= */
export interface WhaleSignal extends BaseSignal {
  category: 'whale'

  type:
    | 'WHALE_BUY'
    | 'WHALE_SELL'
    | 'WHALE_BUY_CONTROL'
    | 'WHALE_SELL_CONTROL'
    | 'WHALE_ACCUMULATION'   // 🔥 추가
    | 'WHALE_DISTRIBUTION'  // 🔥 추가
    | 'WHALE_INFLUENCE'     // 🔥 추가
}

/* =========================================================
 Liquidation Signal
========================================================= */
export interface LiquidationSignal extends BaseSignal {
  category: 'liquidation'

  type:
    | 'LONG_LIQUIDATION'
    | 'SHORT_LIQUIDATION'
    | 'CASCADE_LIQUIDATION'
    | 'EARLY_LIQUIDATION'
}

/* =========================================================
 🔥 Liquidation Map Signal (신규 추가)
========================================================= */
export interface LiquidationMapSignal extends BaseSignal {
  category: 'liquidation_map'

  type:
    | 'LONG_LIQUIDATION_ZONE'
    | 'SHORT_LIQUIDATION_ZONE'
    | 'LONG_SQUEEZE_RISK'
    | 'SHORT_SQUEEZE_RISK'
    | 'LIQUIDATION_CLUSTER'
}

/* =========================================================
 Regime Signal
========================================================= */
export interface RegimeSignal extends BaseSignal {
  category: 'regime'

  type:
    | 'TREND'
    | 'RANGE'
    | 'VOLATILE'
    | 'UNKNOWN'
}

/* =========================================================
 Unified Signal (전체 union)
========================================================= */
export type MarketSignalUnified =
  | StructureSignal
  | PressureSignal
  | WhaleSignal
  | LiquidationSignal
  | LiquidationMapSignal // 🔥 추가
  | RegimeSignal
