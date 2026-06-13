// lib/alerts/indicatorEngine.ts

import { redis } from '../redis'
import { pushIndicatorTriggered } from '@/lib/push/pushOnAlert'
import { getAllUserIds } from '@/lib/push/getAllUserIds'

type Timeframe = '15m' | '1h'

type IndicatorType = 'RSI' | 'MACD' | 'EMA'

type Kline = {
  close: number
  openTime: number
  closeTime: number
}

type IndicatorEnabled = Record<
  IndicatorType,
  Record<Timeframe, boolean>
>

type IndicatorEvent = {
  type: 'INDICATOR_SIGNAL'
  indicator: IndicatorType
  signal: string
  symbol: string
  timeframe: Timeframe
  value: number
  ts: number
  eventCandleTs: number
}

type SignalState = {
  rsiZone: 'OVERSOLD' | 'NEUTRAL' | 'OVERBOUGHT'
  macdTrend: 'ABOVE' | 'BELOW' | 'EQUAL'
  emaTrend: 'ABOVE' | 'BELOW' | 'EQUAL'
  emaStructure:
    | 'BULLISH'
    | 'BEARISH'
    | 'COMPRESSION'
    | 'NEUTRAL'
}

type MACDSeriesPoint = {
  index: number
  macd: number
  signal: number
  histogram: number
}

type MACDResult = {
  macd: number
  signal: number
  histogram: number
  prevMacd: number
  prevSignal: number
  crossedUp: boolean
  crossedDown: boolean
}

type EMASetResult = {
  ema20: number
  ema50: number
  ema100: number | null
  ema200: number | null

  prevEma20: number
  prevEma50: number
  prevEma100: number | null
  prevEma200: number | null

  close: number
  prevClose: number
}

type FetchCache = {
  klines: Kline[]
  lastFetchAt: number
}

const SUPPORTED_TIMEFRAMES: Timeframe[] = [
  '15m',
  '1h',
]

const fetchCache: Record<string, FetchCache> = {}

const lastSignals: Record<
  string,
  {
    RSI?: string
    MACD?: string
    EMA?: string
  }
> = {}

const signalStateMap: Record<string, SignalState> = {}

const lastProcessedCandleMap: Record<string, number> = {}

/* =========================
 * 🔥 indicatorEnabled (Redis 기반)
 * ========================= */
const DEFAULT_INDICATOR_ENABLED: IndicatorEnabled = {
  RSI: {
    '15m': true,
    '1h': true,
  },
  MACD: {
    '15m': true,
    '1h': true,
  },
  EMA: {
    '15m': true,
    '1h': true,
  },
}

let indicatorEnabled: IndicatorEnabled =
  normalizeIndicatorEnabled(
    DEFAULT_INDICATOR_ENABLED,
  )

/* =========================
 * 🔥 Redis Key
 * ========================= */
const REDIS_KEY = 'alerts:indicator:enabled'

/* =========================
 * 🔥 Binance Futures
 * ========================= */
const BINANCE_FUTURES_KLINES_URL =
  'https://fapi.binance.com/fapi/v1/klines'

/* =========================
 * 🔥 Cache TTL
 * ========================= */
const KLINE_CACHE_TTL_MS = 15_000

const EMA_SPREAD_MIN_RATIO = 0.00035

const MACD_ALERT_COOLDOWN_MS =
  60 * 60 * 1000

const lastMacdAlertMap: Record<string, number> = {}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

function normalizeTimeframeEnabled(
  value: unknown,
  fallback: Record<Timeframe, boolean>,
): Record<Timeframe, boolean> {
  /**
   * Legacy migration-safe guard:
   *
   * 기존 Redis schema:
   * indicatorEnabled.RSI = true | false
   *
   * 신규 schema:
   * indicatorEnabled.RSI = {
   *   '15m': boolean,
   *   '1h': boolean,
   * }
   */
  if (isBoolean(value)) {
    return {
      '15m': value,
      '1h': value,
    }
  }

  if (!value || typeof value !== 'object') {
    return {
      ...fallback,
    }
  }

  const candidate =
    value as Partial<Record<Timeframe, unknown>>

  return {
    '15m': isBoolean(candidate['15m'])
      ? candidate['15m']
      : fallback['15m'],

    '1h': isBoolean(candidate['1h'])
      ? candidate['1h']
      : fallback['1h'],
  }
}

function normalizeIndicatorEnabled(
  value: unknown,
): IndicatorEnabled {
  const fallback = DEFAULT_INDICATOR_ENABLED

  if (!value || typeof value !== 'object') {
    return {
      RSI: {
        ...fallback.RSI,
      },
      MACD: {
        ...fallback.MACD,
      },
      EMA: {
        ...fallback.EMA,
      },
    }
  }

  const candidate =
    value as Partial<Record<IndicatorType, unknown>>

  return {
    RSI: normalizeTimeframeEnabled(
      candidate.RSI,
      fallback.RSI,
    ),

    MACD: normalizeTimeframeEnabled(
      candidate.MACD,
      fallback.MACD,
    ),

    EMA: normalizeTimeframeEnabled(
      candidate.EMA,
      fallback.EMA,
    ),
  }
}

function isIndicatorEnabled(
  indicator: IndicatorType,
  timeframe: Timeframe,
) {
  return (
    indicatorEnabled[indicator]?.[timeframe] !==
    false
  )
}

export function setIndicatorEnabled(v: unknown) {
  indicatorEnabled = normalizeIndicatorEnabled(v)
}

async function initIndicatorSettings() {
  try {
    const raw = await redis.get(REDIS_KEY)

    if (raw) {
      const parsed = JSON.parse(raw)

      indicatorEnabled =
        normalizeIndicatorEnabled(parsed)

      /**
       * Migration-safe writeback.
       *
       * Redis 에 legacy boolean schema 가 남아있으면
       * timeframe-aware schema 로 자동 보정합니다.
       */
      try {
        await redis.set(
          REDIS_KEY,
          JSON.stringify(indicatorEnabled),
        )
      } catch (err) {
        console.error(
          '[indicatorEngine][Migration Save Error]',
          err,
        )
      }

      return
    }

    const fallback =
      normalizeIndicatorEnabled(
        DEFAULT_INDICATOR_ENABLED,
      )

    indicatorEnabled = fallback

    try {
      await redis.set(
        REDIS_KEY,
        JSON.stringify(fallback),
      )
    } catch (err) {
      console.error(
        '[indicatorEngine][Fallback Save Error]',
        err,
      )
    }
  } catch (e) {
    console.error('[indicatorEngine init error]', e)

    indicatorEnabled =
      normalizeIndicatorEnabled(
        DEFAULT_INDICATOR_ENABLED,
      )
  }
}

void initIndicatorSettings()

function buildTimeframeKey(
  symbol: string,
  timeframe: Timeframe,
) {
  return `${symbol}:${timeframe}`
}

function buildMacdAlertKey(
  symbol: string,
  timeframe: Timeframe,
  signal: string,
) {
  return `${symbol}:${timeframe}:MACD:${signal}`
}

function isMacdAlertCoolingDown(
  symbol: string,
  timeframe: Timeframe,
  signal: string,
) {
  const key =
    buildMacdAlertKey(
      symbol,
      timeframe,
      signal,
    )

  const last =
    lastMacdAlertMap[key] ?? 0

  return (
    Date.now() - last <
    MACD_ALERT_COOLDOWN_MS
  )
}

function markMacdAlertSent(
  symbol: string,
  timeframe: Timeframe,
  signal: string,
) {
  const key =
    buildMacdAlertKey(
      symbol,
      timeframe,
      signal,
    )

  lastMacdAlertMap[key] = Date.now()
}

function getCloses(klines: Kline[]) {
  return klines.map(k => k.close)
}

function getLastClosedCandleTs(klines: Kline[]) {
  const last = klines[klines.length - 1]
  return last?.closeTime ?? Date.now()
}

/* =========================
 * EMA Full Series
 * ========================= */
export function calculateEMAFull(
  values: Array<number | null>,
  period: number,
): (number | null)[] {
  const result: (number | null)[] = Array(
    values.length,
  ).fill(null)

  if (!values.length) return result

  let seedStart = -1
  const seedValues: number[] = []

  for (let i = 0; i < values.length; i++) {
    const value = values[i]
    if (
      typeof value !== 'number' ||
      !Number.isFinite(value)
    ) {
      continue
    }

    if (seedStart === -1) seedStart = i
    seedValues.push(value)

    if (seedValues.length === period) break
  }

  if (
    seedStart === -1 ||
    seedValues.length < period
  ) {
    return result
  }

  const multiplier = 2 / (period + 1)
  const seedIndex = seedStart + period - 1

  let sma = 0
  for (const value of seedValues) sma += value

  let prevEma = sma / period
  result[seedIndex] = prevEma

  for (
    let i = seedIndex + 1;
    i < values.length;
    i++
  ) {
    const value = values[i]

    if (
      typeof value !== 'number' ||
      !Number.isFinite(value)
    ) {
      result[i] = null
      continue
    }

    const ema =
      value * multiplier +
      prevEma * (1 - multiplier)

    result[i] = ema
    prevEma = ema
  }

  return result
}

/* =========================
 * RSI
 * ========================= */
export function calculateRSI(
  closes: number[],
  length = 14,
): number | null {
  if (closes.length < length + 1) return null

  let gainSum = 0
  let lossSum = 0

  for (let i = 1; i <= length; i++) {
    const change = closes[i] - closes[i - 1]
    if (change > 0) gainSum += change
    else lossSum += Math.abs(change)
  }

  let avgGain = gainSum / length
  let avgLoss = lossSum / length

  for (let i = length + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1]
    const gain = change > 0 ? change : 0
    const loss = change < 0 ? Math.abs(change) : 0

    avgGain =
      (avgGain * (length - 1) + gain) / length
    avgLoss =
      (avgLoss * (length - 1) + loss) / length
  }

  if (avgLoss === 0) return 100

  const rs = avgGain / avgLoss
  return 100 - 100 / (1 + rs)
}

/* =========================
 * MACD Series Builder
 * ========================= */
export function buildMACDSeries(
  closes: number[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9,
): MACDSeriesPoint[] {
  const source = closes.map(v => v as number | null)

  const emaFast = calculateEMAFull(
    source,
    fastPeriod,
  )
  const emaSlow = calculateEMAFull(
    source,
    slowPeriod,
  )

  const macdLine: (number | null)[] = Array(
    closes.length,
  ).fill(null)

  for (let i = 0; i < closes.length; i++) {
    const fast = emaFast[i]
    const slow = emaSlow[i]

    if (
      typeof fast === 'number' &&
      typeof slow === 'number' &&
      Number.isFinite(fast) &&
      Number.isFinite(slow)
    ) {
      macdLine[i] = fast - slow
    }
  }

  const signalLine = calculateEMAFull(
    macdLine,
    signalPeriod,
  )

  const series: MACDSeriesPoint[] = []

  for (let i = 0; i < macdLine.length; i++) {
    const macd = macdLine[i]
    const signal = signalLine[i]

    if (
      typeof macd !== 'number' ||
      typeof signal !== 'number' ||
      !Number.isFinite(macd) ||
      !Number.isFinite(signal)
    ) {
      continue
    }

    series.push({
      index: i,
      macd,
      signal,
      histogram: macd - signal,
    })
  }

  return series
}

/* =========================
 * MACD
 * ========================= */
export function calculateMACD(
  closes: number[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9,
): MACDResult | null {
  const series = buildMACDSeries(
    closes,
    fastPeriod,
    slowPeriod,
    signalPeriod,
  )

  if (series.length < 2) return null

  const current = series[series.length - 1]
  const prev = series[series.length - 2]

  if (
    !Number.isFinite(current.macd) ||
    !Number.isFinite(current.signal) ||
    !Number.isFinite(current.histogram) ||
    !Number.isFinite(prev.macd) ||
    !Number.isFinite(prev.signal)
  ) {
    return null
  }

  const crossedUp =
    prev.macd <= prev.signal &&
    current.macd > current.signal

  const crossedDown =
    prev.macd >= prev.signal &&
    current.macd < current.signal

  return {
    macd: current.macd,
    signal: current.signal,
    histogram: current.histogram,
    prevMacd: prev.macd,
    prevSignal: prev.signal,
    crossedUp,
    crossedDown,
  }
}

/* =========================
 * EMA
 * ========================= */
export function calculateEMASet(
  closes: number[],
): EMASetResult | null {
  if (closes.length < 50) return null

  const source = closes.map(v => v as number | null)

  const ema20Series = calculateEMAFull(source, 20)
  const ema50Series = calculateEMAFull(source, 50)
  const ema100Series = calculateEMAFull(source, 100)
  const ema200Series = calculateEMAFull(source, 200)

  const lastIndex = closes.length - 1
  const prevIndex = closes.length - 2

  const ema20 = ema20Series[lastIndex]
  const ema50 = ema50Series[lastIndex]
  const prevEma20 = ema20Series[prevIndex]
  const prevEma50 = ema50Series[prevIndex]

  const ema100 = ema100Series[lastIndex]
  const prevEma100 = ema100Series[prevIndex]

  const ema200 = ema200Series[lastIndex]
  const prevEma200 = ema200Series[prevIndex]

  if (
    typeof ema20 !== 'number' ||
    typeof ema50 !== 'number' ||
    typeof prevEma20 !== 'number' ||
    typeof prevEma50 !== 'number' ||
    !Number.isFinite(ema20) ||
    !Number.isFinite(ema50) ||
    !Number.isFinite(prevEma20) ||
    !Number.isFinite(prevEma50)
  ) {
    return null
  }

  return {
    ema20,
    ema50,

    ema100:
      typeof ema100 === 'number' &&
      Number.isFinite(ema100)
        ? ema100
        : null,

    ema200:
      typeof ema200 === 'number' &&
      Number.isFinite(ema200)
        ? ema200
        : null,

    prevEma20,
    prevEma50,

    prevEma100:
      typeof prevEma100 === 'number' &&
      Number.isFinite(prevEma100)
        ? prevEma100
        : null,

    prevEma200:
      typeof prevEma200 === 'number' &&
      Number.isFinite(prevEma200)
        ? prevEma200
        : null,

    close: closes[lastIndex],
    prevClose: closes[prevIndex],
  }
}

function isEmaSpreadCompressed(
  basePrice: number,
  first: number,
  second: number,
) {
  if (
    !Number.isFinite(basePrice) ||
    basePrice <= 0
  ) {
    return true
  }

  return (
    Math.abs(first - second) / basePrice <
    EMA_SPREAD_MIN_RATIO
  )
}

function getEmaStructureState(
  ema: EMASetResult,
): SignalState['emaStructure'] {
  const compressed20_50 = isEmaSpreadCompressed(
    ema.close,
    ema.ema20,
    ema.ema50,
  )

  if (compressed20_50) {
    return 'COMPRESSION'
  }

  if (
    typeof ema.ema100 !== 'number' ||
    typeof ema.prevEma100 !== 'number'
  ) {
    return 'NEUTRAL'
  }

  const compressed50_100 = isEmaSpreadCompressed(
    ema.close,
    ema.ema50,
    ema.ema100,
  )

  if (compressed50_100) {
    return 'COMPRESSION'
  }

  const ema20Slope = ema.ema20 - ema.prevEma20
  const ema50Slope = ema.ema50 - ema.prevEma50

  const bullish =
    ema.ema20 > ema.ema50 &&
    ema.ema50 > ema.ema100 &&
    ema.close > ema.ema20 &&
    ema20Slope > 0 &&
    ema50Slope >= 0

  const bearish =
    ema.ema20 < ema.ema50 &&
    ema.ema50 < ema.ema100 &&
    ema.close < ema.ema20 &&
    ema20Slope < 0 &&
    ema50Slope <= 0

  if (bullish) return 'BULLISH'
  if (bearish) return 'BEARISH'

  return 'NEUTRAL'
}

/* =========================
 * fetchKlines
 * ========================= */
export async function fetchKlines(
  symbol: string,
  timeframe: Timeframe = '15m',
): Promise<Kline[]> {
  const normalizedSymbol = String(
    symbol || 'BTCUSDT',
  ).toUpperCase()

  const now = Date.now()
  const cacheKey = buildTimeframeKey(
    normalizedSymbol,
    timeframe,
  )

  const cached = fetchCache[cacheKey]

  if (
    cached &&
    now - cached.lastFetchAt <
      KLINE_CACHE_TTL_MS
  ) {
    return cached.klines
  }

  const url = new URL(BINANCE_FUTURES_KLINES_URL)

  url.searchParams.set('symbol', normalizedSymbol)
  url.searchParams.set('interval', timeframe)
  url.searchParams.set('limit', '250')

  const res = await fetch(url.toString(), {
    method: 'GET',
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(
      `Binance Futures klines fetch failed: ${res.status}`,
    )
  }

  const rows = await res.json()

  const allKlines: Kline[] = Array.isArray(rows)
    ? rows.map((row: any) => ({
        openTime: Number(row[0]),
        close: Number(row[4]),
        closeTime: Number(row[6]),
      }))
    : []

  const klines =
    allKlines.length > 1
      ? allKlines.slice(0, -1)
      : allKlines

  fetchCache[cacheKey] = {
    klines,
    lastFetchAt: now,
  }

  return klines
}

/* =========================
 * detectSignals
 * ========================= */
export function detectSignals(args: {
  symbol: string
  timeframe?: Timeframe
  eventCandleTs?: number
  rsi: number | null
  macd: MACDResult | null
  macd1h?: MACDResult | null
  ema: ReturnType<typeof calculateEMASet>
}): IndicatorEvent[] {
  const {
    symbol,
    timeframe = '15m',
    eventCandleTs = Date.now(),
    rsi,
    macd,
    macd1h,
    ema,
  } = args

  const ts = Date.now()
  const stateKey = buildTimeframeKey(symbol, timeframe)

  if (!signalStateMap[stateKey]) {
    signalStateMap[stateKey] = {
      rsiZone: 'NEUTRAL',
      macdTrend: 'EQUAL',
      emaTrend: 'EQUAL',
      emaStructure: 'NEUTRAL',
    }
  }

  if (!lastSignals[stateKey]) {
    lastSignals[stateKey] = {}
  }

  const prevState = signalStateMap[stateKey]
  const events: IndicatorEvent[] = []

  if (
    isIndicatorEnabled('RSI', timeframe) &&
    typeof rsi === 'number'
  ) {
    let nextZone: SignalState['rsiZone'] =
      'NEUTRAL'

    if (rsi >= 70) nextZone = 'OVERBOUGHT'
    else if (rsi <= 30) nextZone = 'OVERSOLD'

    if (
      prevState.rsiZone !== nextZone &&
      nextZone === 'OVERBOUGHT' &&
      lastSignals[stateKey].RSI !==
        'RSI_OVERBOUGHT'
    ) {
      events.push({
        type: 'INDICATOR_SIGNAL',
        indicator: 'RSI',
        signal: 'RSI_OVERBOUGHT',
        symbol,
        timeframe,
        value: rsi,
        ts,
        eventCandleTs,
      })

      lastSignals[stateKey].RSI =
        'RSI_OVERBOUGHT'
    }

    if (
      prevState.rsiZone !== nextZone &&
      nextZone === 'OVERSOLD' &&
      lastSignals[stateKey].RSI !==
        'RSI_OVERSOLD'
    ) {
      events.push({
        type: 'INDICATOR_SIGNAL',
        indicator: 'RSI',
        signal: 'RSI_OVERSOLD',
        symbol,
        timeframe,
        value: rsi,
        ts,
        eventCandleTs,
      })

      lastSignals[stateKey].RSI =
        'RSI_OVERSOLD'
    }

    prevState.rsiZone = nextZone
  }

  if (
    isIndicatorEnabled('MACD', timeframe) &&
    macd &&
    Number.isFinite(macd.macd) &&
    Number.isFinite(macd.signal) &&
    Number.isFinite(macd.prevMacd) &&
    Number.isFinite(macd.prevSignal)
  ) {
    const macd1hBullish =
      macd1h !== null &&
      macd1h !== undefined &&
      Number.isFinite(macd1h.macd) &&
      Number.isFinite(macd1h.signal) &&
      macd1h.macd > macd1h.signal

    const macd1hBearish =
      macd1h !== null &&
      macd1h !== undefined &&
      Number.isFinite(macd1h.macd) &&
      Number.isFinite(macd1h.signal) &&
      macd1h.macd < macd1h.signal

    const macdGoldenConfirmationOk =
      timeframe === '1h' ||
      macd1hBullish

    const macdDeadConfirmationOk =
      timeframe === '1h' ||
      macd1hBearish

    let nextTrend: SignalState['macdTrend'] =
      'EQUAL'

    if (macd.macd > macd.signal) {
      nextTrend = 'ABOVE'
    } else if (macd.macd < macd.signal) {
      nextTrend = 'BELOW'
    }

    if (
      prevState.macdTrend !== nextTrend &&
      macd.crossedUp &&
      macdGoldenConfirmationOk &&
      !isMacdAlertCoolingDown(
        symbol,
        timeframe,
        'GOLDEN_CROSS',
      ) &&
      lastSignals[stateKey].MACD !==
        'GOLDEN_CROSS'
    ) {
      markMacdAlertSent(
        symbol,
        timeframe,
        'GOLDEN_CROSS',
      )

      events.push({
        type: 'INDICATOR_SIGNAL',
        indicator: 'MACD',
        signal: 'GOLDEN_CROSS',
        symbol,
        timeframe,
        value: macd.macd,
        ts,
        eventCandleTs,
      })

      lastSignals[stateKey].MACD =
        'GOLDEN_CROSS'
    }

    if (
      prevState.macdTrend !== nextTrend &&
      macd.crossedDown &&
      macdDeadConfirmationOk &&
      !isMacdAlertCoolingDown(
        symbol,
        timeframe,
        'DEAD_CROSS',
      ) &&
      lastSignals[stateKey].MACD !==
        'DEAD_CROSS'
    ) {
      markMacdAlertSent(
        symbol,
        timeframe,
        'DEAD_CROSS',
      )

      events.push({
        type: 'INDICATOR_SIGNAL',
        indicator: 'MACD',
        signal: 'DEAD_CROSS',
        symbol,
        timeframe,
        value: macd.macd,
        ts,
        eventCandleTs,
      })

      lastSignals[stateKey].MACD =
        'DEAD_CROSS'
    }

    prevState.macdTrend = nextTrend
  }

  if (
    isIndicatorEnabled('EMA', timeframe) &&
    ema
  ) {
    if (timeframe === '15m') {
      let nextTrend: SignalState['emaTrend'] =
        'EQUAL'

      if (ema.ema20 > ema.ema50) {
        nextTrend = 'ABOVE'
      } else if (ema.ema20 < ema.ema50) {
        nextTrend = 'BELOW'
      }

      const ema20Slope =
        ema.ema20 - ema.prevEma20

      const spreadOk =
        !isEmaSpreadCompressed(
          ema.close,
          ema.ema20,
          ema.ema50,
        )

      const crossedUp =
        ema.prevEma20 <= ema.prevEma50 &&
        ema.ema20 > ema.ema50 &&
        ema.close > ema.ema20 &&
        ema20Slope > 0 &&
        spreadOk

      const crossedDown =
        ema.prevEma20 >= ema.prevEma50 &&
        ema.ema20 < ema.ema50 &&
        ema.close < ema.ema20 &&
        ema20Slope < 0 &&
        spreadOk

      if (
        prevState.emaTrend !== nextTrend &&
        crossedUp &&
        lastSignals[stateKey].EMA !==
          'BULLISH_TREND'
      ) {
        events.push({
          type: 'INDICATOR_SIGNAL',
          indicator: 'EMA',
          signal: 'BULLISH_TREND',
          symbol,
          timeframe,
          value: ema.ema20,
          ts,
          eventCandleTs,
        })

        lastSignals[stateKey].EMA =
          'BULLISH_TREND'
      }

      if (
        prevState.emaTrend !== nextTrend &&
        crossedDown &&
        lastSignals[stateKey].EMA !==
          'BEARISH_TREND'
      ) {
        events.push({
          type: 'INDICATOR_SIGNAL',
          indicator: 'EMA',
          signal: 'BEARISH_TREND',
          symbol,
          timeframe,
          value: ema.ema20,
          ts,
          eventCandleTs,
        })

        lastSignals[stateKey].EMA =
          'BEARISH_TREND'
      }

      prevState.emaTrend = nextTrend
    }

    if (timeframe === '1h') {
      const nextStructure =
        getEmaStructureState(ema)

      if (
        nextStructure === 'BULLISH' &&
        prevState.emaStructure !==
          'BULLISH' &&
        lastSignals[stateKey].EMA !==
          'BULLISH_TREND'
      ) {
        events.push({
          type: 'INDICATOR_SIGNAL',
          indicator: 'EMA',
          signal: 'BULLISH_TREND',
          symbol,
          timeframe,
          value: ema.ema20,
          ts,
          eventCandleTs,
        })

        lastSignals[stateKey].EMA =
          'BULLISH_TREND'
      }

      if (
        nextStructure === 'BEARISH' &&
        prevState.emaStructure !==
          'BEARISH' &&
        lastSignals[stateKey].EMA !==
          'BEARISH_TREND'
      ) {
        events.push({
          type: 'INDICATOR_SIGNAL',
          indicator: 'EMA',
          signal: 'BEARISH_TREND',
          symbol,
          timeframe,
          value: ema.ema20,
          ts,
          eventCandleTs,
        })

        lastSignals[stateKey].EMA =
          'BEARISH_TREND'
      }

      prevState.emaStructure =
        nextStructure
    }
  }

  return events
}

/* =========================
 * Main Entry
 * ========================= */
export async function handleIndicatorTick(
  symbol: string,
  price: number,
) {
  try {
    void price

    const normalizedSymbol = String(
      symbol || 'BTCUSDT',
    ).toUpperCase()

    const signals: IndicatorEvent[] = []

    let macd1hForConfirmation:
      | MACDResult
      | null = null

    try {
      const klines1h =
        await fetchKlines(
          normalizedSymbol,
          '1h',
        )

      if (klines1h.length >= 50) {
        macd1hForConfirmation =
          calculateMACD(
            getCloses(klines1h),
            12,
            26,
            9,
          )
      }
    } catch {}

    for (const timeframe of SUPPORTED_TIMEFRAMES) {
      const stateKey = buildTimeframeKey(
        normalizedSymbol,
        timeframe,
      )

      const klines = await fetchKlines(
        normalizedSymbol,
        timeframe,
      )

      if (klines.length < 50) {
        continue
      }

      const eventCandleTs =
        getLastClosedCandleTs(klines)

      if (
        lastProcessedCandleMap[stateKey] ===
        eventCandleTs
      ) {
        continue
      }

      lastProcessedCandleMap[stateKey] =
        eventCandleTs

      const closes = getCloses(klines)

      const rsi = calculateRSI(closes, 14)
      const macd = calculateMACD(
        closes,
        12,
        26,
        9,
      )
      const ema = calculateEMASet(closes)

      const timeframeSignals = detectSignals({
        symbol: normalizedSymbol,
        timeframe,
        eventCandleTs,
        rsi,
        macd,
        macd1h:
          macd1hForConfirmation,
        ema,
      })

      signals.push(...timeframeSignals)
    }

    if (!signals.length) return

    const userIds = await getAllUserIds()
    if (!userIds.length) return

    for (const payload of signals) {
      console.log('[INDICATOR_SIGNAL]', payload)

      await redis.publish(
        'realtime:alerts',
        JSON.stringify(payload),
      )

      await Promise.all(
        userIds.map(userId =>
          pushIndicatorTriggered({
            userId,
            indicator: payload.indicator,
            signal: payload.signal,
            symbol: payload.symbol,
            value: payload.value,
            ts: payload.ts,
            timeframe: payload.timeframe,
            eventCandleTs:
              payload.eventCandleTs,
          }),
        ),
      )
    }
  } catch (e) {
    console.error('[indicatorEngine]', e)
  }
}
