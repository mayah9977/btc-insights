/* =========================================================
 Interpreter Types (FINAL)

 목적
 - interpreterEngine 결과 구조 통합
 - string[] 완전 제거
========================================================= */

import {
  StructureSignal,
  PressureSignal,
  WhaleSignal,
  LiquidationSignal,
  RegimeSignal,
} from './signalTypes'

/* =========================================================
 Interpreter Result (Typed)
========================================================= */
export interface InterpreterResult {

  structureSignals: StructureSignal[]

  pressureSignals: PressureSignal[]

  whaleSignals: WhaleSignal[]

  liquidationSignals: LiquidationSignal[]

  regimeSignals: RegimeSignal[]

  /* liquidationMap 포함 */
  liquidationMapSignals: LiquidationSignal[]
}
