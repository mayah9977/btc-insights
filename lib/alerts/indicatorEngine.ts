// /lib/alerts/indicatorEngine.ts
import { redis } from '../redis'

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

type MACDResult = {
  macd: number
  signal: number
  histogram: number
  prevMacd: number
  prevSignal: number
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
 * - every tick API call 금지
 * - 10 ~ 30초 캐싱 요구사항 반영
 * ========================= */
const KLINE_CACHE_TTL_MS = 15_000

export function setIndicatorEnabled(v: IndicatorEnabled) {
  indicatorEnabled = v
}

/* =========================
 * 🔥 서버 시작 시 Redis 로드
 * - 값 없으면 fallback 생성 + Redis 저장
 * - 이후 메모리 캐시 사용
 * ========================= */
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

/* =========================
 * Utils
 * ========================= */
function getCloses(klines: Kline[]) {
  return klines.map(k => k.close)
}

function calculateEMA(values: number[], period: number): number[] {
  if (!values.length) return []
  if (values.length < period) return []

  const multiplier = 2 / (period + 1)
  const result: number[] = []

  let sma = 0
  for (let i = 0; i < period; i++) {
    sma += values[i]
  }

  let prevEma = sma / period
  result[period - 1] = prevEma

  for (let i = period; i < values.length; i++) {
    const ema = values[i] * multiplier + prevEma * (1 - multiplier)
    result[i] = ema
    prevEma = ema
  }

  return result
}

/* =========================
 * RSI (TradingView 유사)
 * - Close 기준
 * - Length 14
 * - Wilder's smoothing
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
    if (change >= 0) gainSum += change
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
 * MACD
 * - fast: 12
 * - slow: 26
 * - signal: 9
 * ========================= */
export function calculateMACD(
  closes: number[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9,
): MACDResult | null {
  if (closes.length < slowPeriod + signalPeriod) return null

  const emaFast = calculateEMA(closes, fastPeriod)
  const emaSlow = calculateEMA(closes, slowPeriod)

  const macdLine: number[] = []

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

  const macdValues = macdLine.filter(v => typeof v === 'number')
  const signalValues = calculateEMA(macdValues, signalPeriod)

  if (!signalValues.length) return null

  const macd = macdValues[macdValues.length - 1]
  const signal = signalValues[signalValues.length - 1]
  const prevMacd = macdValues[macdValues.length - 2]
  const prevSignal = signalValues[signalValues.length - 2]

  if (
    !Number.isFinite(macd) ||
    !Number.isFinite(signal) ||
    !Number.isFinite(prevMacd) ||
    !Number.isFinite(prevSignal)
  ) {
    return null
  }

  return {
    macd,
    signal,
    histogram: macd - signal,
    prevMacd,
    prevSignal,
  }
}

/* =========================
 * EMA
 * - EMA 7 / EMA 20
 * ========================= */
export function calculateEMASet(closes: number[]) {
  if (closes.length < 20) return null

  const ema7Series = calculateEMA(closes, 7)
  const ema20Series = calculateEMA(closes, 20)

  const ema7 = ema7Series[ema7Series.length - 1]
  const ema20 = ema20Series[ema20Series.length - 1]
  const prevEma7 = ema7Series[ema7Series.length - 2]
  const prevEma20 = ema20Series[ema20Series.length - 2]

  if (
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
 * Binance Futures Klines
 * - /fapi/v1/klines
 * - BTCUSDT / 15m / 100
 * - 캐싱 적용
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

  const klines: Kline[] = Array.isArray(rows)
    ? rows.map((row: any) => ({
        openTime: Number(row[0]),
        close: Number(row[4]),
        closeTime: Number(row[6]),
      }))
    : []

  fetchCache[normalizedSymbol] = {
    klines,
    lastFetchAt: now,
  }

  return klines
}

/* =========================
 * Signal Detector
 * - Fake signal filter
 * - "entry point" only
 * - 이전 상태 vs 현재 상태 비교
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

  /* =========================
   * RSI entry detection
   * - 68 -> 71 -> 73 => 70 돌파 시 1회만
   * - 32 -> 29 -> 25 => 30 이탈 시 1회만
   * ========================= */
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

  /* =========================
   * MACD cross detection
   * - previous state vs current state
   * ========================= */
  if (indicatorEnabled.MACD && macd) {
    let nextTrend: SignalState['macdTrend'] = 'EQUAL'

    if (macd.macd > macd.signal) nextTrend = 'ABOVE'
    else if (macd.macd < macd.signal) nextTrend = 'BELOW'

    const crossedUp =
      macd.prevMacd <= macd.prevSignal && macd.macd > macd.signal
    const crossedDown =
      macd.prevMacd >= macd.prevSignal && macd.macd < macd.signal

    if (
      prevState.macdTrend !== nextTrend &&
      crossedUp &&
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
      crossedDown &&
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

  /* =========================
   * EMA trend entry detection
   * - EMA7 vs EMA20
   * - previous state vs current state
   * ========================= */
  if (indicatorEnabled.EMA && ema) {
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
 * - handleIndicatorTick 구조 유지
 * - tick price 기반 계산 제거
 * - Binance Futures 15m close 기반
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

    for (const payload of signals) {
      console.log('[INDICATOR_SIGNAL]', payload)

      await redis.publish(
        'realtime:alerts',
        JSON.stringify(payload),
      )
    }
  } catch (e) {
    console.error('[indicatorEngine]', e)
  }
}
