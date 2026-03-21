/* =========================================================
 Narrative Signal Types (FINAL)

 목적
 - Cause / Risk / Strategy 분리 기준 정의
 - Mapper에서 사용
========================================================= */

import {
  StructureSignal,
  PressureSignal,
  WhaleSignal,
  LiquidationSignal,
  RegimeSignal,
} from './signalTypes'

/* =========================================================
 Cause Signals
========================================================= */
export type CauseSignal =
  | StructureSignal
  | PressureSignal
  | WhaleSignal

/* =========================================================
 Risk Signals
========================================================= */
export type RiskSignal =
  | LiquidationSignal
  | RegimeSignal
  | PressureSignal // 일부 pressure도 리스크로 사용 가능

/* =========================================================
 Strategy Signals
========================================================= */
export interface StrategySignal {
  message: string
}

/* =========================================================
 Narrative Section Typed Map
========================================================= */
export interface NarrativeSectionTypedMap {

  situation: any[] // snapshot 기반이라 비워둠

  cause: CauseSignal[]

  risk: RiskSignal[]

  strategy: StrategySignal[]
}
