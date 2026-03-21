/* =========================================================
  Interpreter Engine (FINAL CLEAN VERSION)
  👉 역할: 해석 ONLY (계산/스토어 업데이트 없음)
========================================================= */

import { MarketSnapshot } from '@/lib/market/engine/marketSnapshot'

import { interpretMarketStructure } from '@/lib/market/narrative/marketStructureInterpreter'
import { interpretLiquidation } from '@/lib/market/narrative/liquidationInterpreter'
import { interpretWhaleControl } from '@/lib/market/narrative/whaleControlInterpreter'
import { interpretMarketRegime } from '@/lib/market/narrative/marketRegimeInterpreter'

import { interpretPositionPressure } from '@/lib/market/pressure/positionPressureInterpreter'
import { interpretLiquidationMap } from '@/lib/market/liquidation/liquidationMapInterpreter'

import {
  getCachedInterpreter,
  setCachedInterpreter,
} from '@/lib/market/engine/interpreterCache'

import {
  StructureSignal,
  PressureSignal,
  LiquidationSignal,
  WhaleSignal,
  RegimeSignal,
  LiquidationMapSignal,
} from '@/lib/market/types/signalTypes'

/* =========================================================
  Result Type
========================================================= */
export interface InterpreterEngineResult {
  structureSignals: StructureSignal[]
  pressureSignals: PressureSignal[]
  liquidationSignals: LiquidationSignal[]
  whaleSignals: WhaleSignal[]
  regimeSignals: RegimeSignal[]
  liquidationMapSignals: LiquidationMapSignal[]

  allSignals: (
    | StructureSignal
    | PressureSignal
    | LiquidationSignal
    | WhaleSignal
    | RegimeSignal
    | LiquidationMapSignal
  )[]
}

/* =========================================================
  Main Engine
========================================================= */
export function runInterpreterEngine(
  snapshot: MarketSnapshot,
): InterpreterEngineResult {
  /* =========================
    Cache
  ========================= */
  const cached = getCachedInterpreter(snapshot)
  if (cached) return cached

  /* =========================
    Interpreters
  ========================= */
  const { structureSignals } = interpretMarketStructure(snapshot)
  const { liquidationSignals } = interpretLiquidation(snapshot)
  const { whaleSignals } = interpretWhaleControl(snapshot)
  const { regimeSignals } = interpretMarketRegime(snapshot)
  const { pressureSignals } = interpretPositionPressure(snapshot)
  const { liquidationMapSignals } = interpretLiquidationMap(snapshot)

  /* =========================
    Normalize
  ========================= */
  const normalized: InterpreterEngineResult = {
    structureSignals: structureSignals ?? [],
    pressureSignals: pressureSignals ?? [],
    liquidationSignals: liquidationSignals ?? [],
    whaleSignals: whaleSignals ?? [],
    regimeSignals: regimeSignals ?? [],
    liquidationMapSignals: liquidationMapSignals ?? [],

    allSignals: [
      ...(structureSignals ?? []),
      ...(pressureSignals ?? []),
      ...(liquidationSignals ?? []),
      ...(whaleSignals ?? []),
      ...(regimeSignals ?? []),
      ...(liquidationMapSignals ?? []),
    ],
  }

  /* =========================
    Cache Save
  ========================= */
  setCachedInterpreter(snapshot, normalized)

  return normalized
}
