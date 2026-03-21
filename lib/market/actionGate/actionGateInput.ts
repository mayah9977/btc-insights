/* =====================================================
 * ActionGateInput (SSOT) - V3 (FMAI 확장 포함)
 *
 * 목적:
 * - getActionGateState (리스크 게이트)
 * - marketRealtimeConsumer (gate 계산 입력)
 *
 * 원칙:
 * - ✅ 실시간 수치/시그널만 포함
 * - ❌ 구조적 boolean 제거
 * - 🔥 FMAI 확장 가능 구조
 * ===================================================== */

import type { BollingerSignalType } from '@/lib/market/actionGate/signalType'
import type { MACDResult } from '@/lib/market/macd'
import type { FMAIResult } from '@/lib/market/momentum/futuresMomentumAlignment'

export interface ActionGateInput {
  /* 1) Bollinger 30m (확정 시그널) */
  bollingerSignal: BollingerSignalType | null

  /* 2) Futures OI */
  oiDelta: number
  oiDeltaRatio: number

  /* 3) Funding */
  fundingRate: number

  /* 4) MACD (확정봉 기반) */
  macd: MACDResult | null

  /* 5) Whale Pressure */
  whalePressure: 'NORMAL' | 'ELEVATED' | 'EXTREME'

  /* 6) 🔥 FMAI 확장 (선택적 사용) */
  fmaiScore?: number // 정량 점수 기반 gate 확장 대비
  fmai?: FMAIResult | null // 전체 FMAI 객체 전달 가능
}
