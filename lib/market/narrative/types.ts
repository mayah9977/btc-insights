/* =========================================================
Market Structure Trend
기본 시장 흐름 설명
========================================================= */

export type MarketTrend =
  | 'OI_INCREASE'
  | 'OI_DECREASE'
  | 'VOLUME_SURGE'
  | 'VOLUME_DROP'
  | 'WHALE_BUY_DOMINANT'
  | 'WHALE_SELL_DOMINANT'
  | 'LONG_OVERHEATED'
  | 'SHORT_OVERHEATED'

/* =========================================================
Institutional Flow
기관 자금 흐름
========================================================= */

export type InstitutionalFlow =
  | 'INSTITUTIONAL_ACCUMULATION'
  | 'INSTITUTIONAL_DISTRIBUTION'

/* =========================================================
Liquidation Signal
청산 이벤트
========================================================= */

export type LiquidationSignal =
  | 'LONG_LIQUIDATION'
  | 'SHORT_LIQUIDATION'

/* =========================================================
Overheat Signal
포지션 과열
========================================================= */

export type OverheatSignal =
  | 'LONG_OVERHEAT'
  | 'SHORT_OVERHEAT'

/* =========================================================
Whale Control Signal
고래 시장 지배
========================================================= */

export type WhaleControlSignal =
  | 'WHALE_BUY_CONTROL'
  | 'WHALE_SELL_CONTROL'

/* =========================================================
Market Regime Signal
시장 상태
========================================================= */

export type MarketRegimeSignal =
  | 'TREND'
  | 'RANGE'
  | 'VOLATILE'
  | 'UNKNOWN'

/* =========================================================
Market Structure Signal
해석 엔진이 반환하는 구조
========================================================= */

export interface MarketStructureSignal {

  /* 기본 트렌드 */
  trends: MarketTrend[]

  /* 기관 흐름 */
  institutionalFlows?: InstitutionalFlow[]

  /* 청산 이벤트 */
  liquidations?: LiquidationSignal[]

  /* 포지션 과열 */
  overheats?: OverheatSignal[]

  /* 고래 시장 지배 */
  whaleControl?: WhaleControlSignal[]

  /* 시장 상태 */
  regime?: MarketRegimeSignal
}

/* =========================================================
Narrative Output Structure
(기존 generateNarrative 출력 구조)
========================================================= */

export interface NarrativeStructure {

  /* 해석된 시장 구조 */
  structure: MarketStructureSignal

  /* 문장 생성용 설명 */
  description: string
}

/* =========================================================
NEW — Narrative Section Map
AI 보고서 4단 구조
========================================================= */

export interface NarrativeSectionMap {

  /* 상황 */
  situation: string[]

  /* 원인 */
  cause: string[]

  /* 리스크 */
  risk: string[]

  /* 전략 */
  strategy: string[]
}

/* =========================================================
NEW — Final AI Narrative Report
최종 AI 분석 보고서 구조
========================================================= */

export interface FinalNarrativeReport {

  /* 기본 요약 */
  summary: string

  /* 키워드 */
  tendency: string

  /* 상황 */
  situation: string

  /* 원인 */
  cause: string

  /* 리스크 */
  risk: string

  /* 전략 */
  strategy: string

  /* 전체 문장 */
  description: string
}

/* =========================================================
Threshold Config (공통)
시장 민감도 조정
========================================================= */

export interface MarketThresholdConfig {

  whaleAccumulationRatio: number
  whaleDistributionRatio: number

  liquidationVolumeRatio: number

  longOverheatFunding: number
  shortOverheatFunding: number
}

/* =========================================================
Default Threshold
========================================================= */

export const DEFAULT_MARKET_THRESHOLD: MarketThresholdConfig = {

  whaleAccumulationRatio: 0.05,
  whaleDistributionRatio: -0.05,

  liquidationVolumeRatio: 1.4,

  longOverheatFunding: 0.0015,
  shortOverheatFunding: -0.0015,
}
