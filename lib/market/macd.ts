/* =========================================================
   📊 MACD Calculation Utility (30m Futures 기준)
========================================================= */

export type MACDCrossType =
  | 'GOLDEN'
  | 'DEAD'
  | 'NONE'

/* 🔥 공용 타입 (Store / DecisionEngine에서 사용) */
export interface MACDState {
  macd: number
  signal: number
  histogram: number
  cross: MACDCrossType
}

/* 기존 이름 호환 유지 (선택) */
export type MACDResult = MACDState

/* =========================================================
   🔥 MACD 계산 메인 함수
========================================================= */

export function calculateMACD(
  closes: number[],
  shortPeriod = 12,
  longPeriod = 26,
  signalPeriod = 9,
): MACDState | null {

  if (closes.length < longPeriod + signalPeriod) {
    return null
  }

  const ema = (data: number[], period: number) => {
    const k = 2 / (period + 1)
    let prev = data[0]
    const result: number[] = []

    for (let i = 0; i < data.length; i++) {
      const price = data[i]
      prev = i === 0 ? price : price * k + prev * (1 - k)
      result.push(prev)
    }

    return result
  }

  const emaShort = ema(closes, shortPeriod)
  const emaLong = ema(closes, longPeriod)

  const macdLine = emaShort.map((v, i) => v - emaLong[i])
  const signalLine = ema(macdLine, signalPeriod)

  const macd = macdLine[macdLine.length - 1]
  const signal = signalLine[signalLine.length - 1]
  const histogram = macd - signal

  let cross: MACDCrossType = 'NONE'

  const prevMacd = macdLine[macdLine.length - 2]
  const prevSignal = signalLine[signalLine.length - 2]
  const prevHistogram = prevMacd - prevSignal

  if (prevHistogram < 0 && histogram > 0) {
    cross = 'GOLDEN'
  }

  if (prevHistogram > 0 && histogram < 0) {
    cross = 'DEAD'
  }

  return {
    macd: round(macd),
    signal: round(signal),
    histogram: round(histogram),
    cross,
  }
}

/* ========================================================= */

function round(value: number, decimals = 6) {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}
