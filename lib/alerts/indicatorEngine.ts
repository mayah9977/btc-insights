// /lib/alerts/indicatorEngine.ts
import { redis } from '../redis'
import { pushIndicatorTriggered } from '@/lib/push/pushOnAlert'
import { getAllUserIds } from '@/lib/push/getAllUserIds'

type Kline = {
  close: number
  openTime: number
  closeTime: number
}

type IndicatorEnabled = {
  RSI: boolean
  MACD: boolean
  EMA: boolean
}

type IndicatorEvent = {
  type: 'INDICATOR_SIGNAL'
  indicator: 'RSI' | 'MACD' | 'EMA'
  signal: string
  symbol: string
  timeframe: '15m'
  value: number
  ts: number
}

type SignalState = {
  rsiZone: 'OVERSOLD' | 'NEUTRAL' | 'OVERBOUGHT'
  macdTrend: 'ABOVE' | 'BELOW' | 'EQUAL'
  emaTrend: 'ABOVE' | 'BELOW' | 'EQUAL'
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
  ema7: number
  ema20: number
  prevEma7: number
  prevEma20: number
}

type FetchCache = {
  klines: Kline[]
  lastFetchAt: number
}

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

/* =========================
 * 🔥 indicatorEnabled (Redis 기반)
 * ========================= */
let indicatorEnabled: IndicatorEnabled = {
  RSI: true,
  MACD: true,
  EMA: true,
}

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

export function setIndicatorEnabled(v: IndicatorEnabled) {
  indicatorEnabled = v
}

async function initIndicatorSettings() {
  try {
    const raw = await redis.get(REDIS_KEY)

    if (raw) {
      const parsed = JSON.parse(raw) as Partial<IndicatorEnabled>

      indicatorEnabled = {
        RSI: !!parsed.RSI,
        MACD: !!parsed.MACD,
        EMA: !!parsed.EMA,
      }

      console.log('[indicatorEngine][Redis Loaded]', indicatorEnabled)
      return
    }

    const fallback: IndicatorEnabled = {
      RSI: true,
      MACD: true,
      EMA: true,
    }

    indicatorEnabled = fallback

    try {
      await redis.set(REDIS_KEY, JSON.stringify(fallback))
      console.log('[indicatorEngine][Fallback Saved to Redis]')
    } catch (err) {
      console.error('[indicatorEngine][Fallback Save Error]', err)
    }
  } catch (e) {
    console.error('[indicatorEngine init error]', e)

    indicatorEnabled = {
      RSI: true,
      MACD: true,
      EMA: true,
    }
  }
}

void initIndicatorSettings()

function getCloses(klines: Kline[]) {
  return klines.map(k => k.close)
}

/* =========================
 * EMA Full Series
 * ========================= */
export function calculateEMAFull(
  values: Array<number | null>,
  period: number,
): (number | null)[] {
  const result: (number | null)[] = Array(values.length).fill(null)

  if (!values.length) return result

  let seedStart = -1
  const seedValues: number[] = []

  for (let i = 0; i < values.length; i++) {
    const value = values[i]
    if (typeof value !== 'number' || !Number.isFinite(value)) continue

    if (seedStart === -1) seedStart = i
    seedValues.push(value)

    if (seedValues.length === period) break
  }

  if (seedStart === -1 || seedValues.length < period) {
    return result
  }

  const multiplier = 2 / (period + 1)
  const seedIndex = seedStart + period - 1

  let sma = 0
  for (const value of seedValues) sma += value

  let prevEma = sma / period
  result[seedIndex] = prevEma

  for (let i = seedIndex + 1; i < values.length; i++) {
    const value = values[i]

    if (typeof value !== 'number' || !Number.isFinite(value)) {
      result[i] = null
      continue
    }

    const ema = value * multiplier + prevEma * (1 - multiplier)
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

    avgGain = (avgGain * (length - 1) + gain) / length
    avgLoss = (avgLoss * (length - 1) + loss) / length
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

  const emaFast = calculateEMAFull(source, fastPeriod)
  const emaSlow = calculateEMAFull(source, slowPeriod)

  const macdLine: (number | null)[] = Array(closes.length).fill(null)

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

  const signalLine = calculateEMAFull(macdLine, signalPeriod)

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
    prev.macd <= prev.signal && current.macd > current.signal

  const crossedDown =
    prev.macd >= prev.signal && current.macd < current.signal

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
  if (closes.length < 20) return null

  const source = closes.map(v => v as number | null)
  const ema7Series = calculateEMAFull(source, 7)
  const ema20Series = calculateEMAFull(source, 20)

  const ema7 = ema7Series[ema7Series.length - 1]
  const ema20 = ema20Series[ema20Series.length - 1]
  const prevEma7 = ema7Series[ema7Series.length - 2]
  const prevEma20 = ema20Series[ema20Series.length - 2]

  if (
    typeof ema7 !== 'number' ||
    typeof ema20 !== 'number' ||
    typeof prevEma7 !== 'number' ||
    typeof prevEma20 !== 'number' ||
    !Number.isFinite(ema7) ||
    !Number.isFinite(ema20) ||
    !Number.isFinite(prevEma7) ||
    !Number.isFinite(prevEma20)
  ) {
    return null
  }

  return {
    ema7,
    ema20,
    prevEma7,
    prevEma20,
  }
}

/* =========================
 * fetchKlines
 * ========================= */
export async function fetchKlines(
  symbol: string,
): Promise<Kline[]> {
  const normalizedSymbol = String(symbol || 'BTCUSDT').toUpperCase()
  const now = Date.now()
  const cached = fetchCache[normalizedSymbol]

  if (cached && now - cached.lastFetchAt < KLINE_CACHE_TTL_MS) {
    return cached.klines
  }

  const url = new URL(BINANCE_FUTURES_KLINES_URL)
  url.searchParams.set('symbol', normalizedSymbol)
  url.searchParams.set('interval', '15m')
  url.searchParams.set('limit', '100')

  const res = await fetch(url.toString(), {
    method: 'GET',
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`Binance Futures klines fetch failed: ${res.status}`)
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
    allKlines.length > 1 ? allKlines.slice(0, -1) : allKlines

  fetchCache[normalizedSymbol] = {
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
  rsi: number | null
  macd: MACDResult | null
  ema: ReturnType<typeof calculateEMASet>
}): IndicatorEvent[] {
  const { symbol, rsi, macd, ema } = args
  const ts = Date.now()

  if (!signalStateMap[symbol]) {
    signalStateMap[symbol] = {
      rsiZone: 'NEUTRAL',
      macdTrend: 'EQUAL',
      emaTrend: 'EQUAL',
    }
  }

  if (!lastSignals[symbol]) {
    lastSignals[symbol] = {}
  }

  const prevState = signalStateMap[symbol]
  const events: IndicatorEvent[] = []

  if (indicatorEnabled.RSI && typeof rsi === 'number') {
    let nextZone: SignalState['rsiZone'] = 'NEUTRAL'

    if (rsi >= 70) nextZone = 'OVERBOUGHT'
    else if (rsi <= 30) nextZone = 'OVERSOLD'

    if (
      prevState.rsiZone !== nextZone &&
      nextZone === 'OVERBOUGHT' &&
      lastSignals[symbol].RSI !== 'RSI_OVERBOUGHT'
    ) {
      events.push({
        type: 'INDICATOR_SIGNAL',
        indicator: 'RSI',
        signal: 'RSI_OVERBOUGHT',
        symbol,
        timeframe: '15m',
        value: rsi,
        ts,
      })
      lastSignals[symbol].RSI = 'RSI_OVERBOUGHT'
    }

    if (
      prevState.rsiZone !== nextZone &&
      nextZone === 'OVERSOLD' &&
      lastSignals[symbol].RSI !== 'RSI_OVERSOLD'
    ) {
      events.push({
        type: 'INDICATOR_SIGNAL',
        indicator: 'RSI',
        signal: 'RSI_OVERSOLD',
        symbol,
        timeframe: '15m',
        value: rsi,
        ts,
      })
      lastSignals[symbol].RSI = 'RSI_OVERSOLD'
    }

    prevState.rsiZone = nextZone
  }

  if (
    indicatorEnabled.MACD &&
    macd &&
    Number.isFinite(macd.macd) &&
    Number.isFinite(macd.signal) &&
    Number.isFinite(macd.prevMacd) &&
    Number.isFinite(macd.prevSignal)
  ) {
    let nextTrend: SignalState['macdTrend'] = 'EQUAL'

    if (macd.macd > macd.signal) nextTrend = 'ABOVE'
    else if (macd.macd < macd.signal) nextTrend = 'BELOW'

    if (
      prevState.macdTrend !== nextTrend &&
      macd.crossedUp &&
      lastSignals[symbol].MACD !== 'GOLDEN_CROSS'
    ) {
      events.push({
        type: 'INDICATOR_SIGNAL',
        indicator: 'MACD',
        signal: 'GOLDEN_CROSS',
        symbol,
        timeframe: '15m',
        value: macd.macd,
        ts,
      })
      lastSignals[symbol].MACD = 'GOLDEN_CROSS'
    }

    if (
      prevState.macdTrend !== nextTrend &&
      macd.crossedDown &&
      lastSignals[symbol].MACD !== 'DEAD_CROSS'
    ) {
      events.push({
        type: 'INDICATOR_SIGNAL',
        indicator: 'MACD',
        signal: 'DEAD_CROSS',
        symbol,
        timeframe: '15m',
        value: macd.macd,
        ts,
      })
      lastSignals[symbol].MACD = 'DEAD_CROSS'
    }

    prevState.macdTrend = nextTrend
  }

  if (
    indicatorEnabled.EMA &&
    ema &&
    typeof ema.ema7 === 'number' &&
    typeof ema.ema20 === 'number' &&
    typeof ema.prevEma7 === 'number' &&
    typeof ema.prevEma20 === 'number' &&
    Number.isFinite(ema.ema7) &&
    Number.isFinite(ema.ema20) &&
    Number.isFinite(ema.prevEma7) &&
    Number.isFinite(ema.prevEma20)
  ) {
    let nextTrend: SignalState['emaTrend'] = 'EQUAL'

    if (ema.ema7 > ema.ema20) nextTrend = 'ABOVE'
    else if (ema.ema7 < ema.ema20) nextTrend = 'BELOW'

    const crossedUp =
      ema.prevEma7 <= ema.prevEma20 && ema.ema7 > ema.ema20
    const crossedDown =
      ema.prevEma7 >= ema.prevEma20 && ema.ema7 < ema.ema20

    if (
      prevState.emaTrend !== nextTrend &&
      crossedUp &&
      lastSignals[symbol].EMA !== 'BULLISH_TREND'
    ) {
      events.push({
        type: 'INDICATOR_SIGNAL',
        indicator: 'EMA',
        signal: 'BULLISH_TREND',
        symbol,
        timeframe: '15m',
        value: ema.ema7,
        ts,
      })
      lastSignals[symbol].EMA = 'BULLISH_TREND'
    }

    if (
      prevState.emaTrend !== nextTrend &&
      crossedDown &&
      lastSignals[symbol].EMA !== 'BEARISH_TREND'
    ) {
      events.push({
        type: 'INDICATOR_SIGNAL',
        indicator: 'EMA',
        signal: 'BEARISH_TREND',
        symbol,
        timeframe: '15m',
        value: ema.ema7,
        ts,
      })
      lastSignals[symbol].EMA = 'BEARISH_TREND'
    }

    prevState.emaTrend = nextTrend
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
    const normalizedSymbol = String(symbol || 'BTCUSDT').toUpperCase()

    const klines = await fetchKlines(normalizedSymbol)
    if (klines.length < 50) return

    const closes = getCloses(klines)

    const rsi = calculateRSI(closes, 14)
    const macd = calculateMACD(closes, 12, 26, 9)
    const ema = calculateEMASet(closes)

    const signals = detectSignals({
      symbol: normalizedSymbol,
      rsi,
      macd,
      ema,
    })

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
          }),
        ),
      )
    }
  } catch (e) {
    console.error('[indicatorEngine]', e)
  }
}
