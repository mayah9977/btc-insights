import { calculateBollingerBands } from './bollinger'
import { evaluateConfirmedBollinger } from './evaluateConfirmedBollinger'
import { evaluateRealtimeBollinger } from './evaluateRealtimeBollinger'
import { preload30mCloses } from './preload30mCloses'
import { BollingerSignalType } from '@/lib/market/actionGate/signalType'

/* 🔥 추가 */
import { calculateMACD } from '@/lib/market/macd'
import { setLastMACD } from '@/lib/market/marketLastStateStore'

/* ============================================================
 * Types
 * ============================================================ */

export type PriceTick = {
  price: number
  ts: number
}

export type Candle30m = {
  openTime: number
  closeTime: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export type ConfirmedBBSignal = {
  type: 'BB_SIGNAL'
  symbol: string
  timeframe: '30m'
  signalType: BollingerSignalType
  candle: Candle30m
  bands: {
    upperBand: number
    lowerBand: number
  }
  confirmed: true
  at: number
}

export type LiveBollingerCommentary = {
  type: 'BB_LIVE_COMMENTARY'
  symbol: string
  timeframe: '30m'
  signalType: BollingerSignalType
  candle: Candle30m
  bands: {
    upperBand: number
    lowerBand: number
  }
  confirmed: false
  at: number
}

/* ============================================================
 * Candle Aggregator
 * ============================================================ */

export class CandleAggregator30m {
  private symbol: string
  private closes: number[] = []
  private current?: Candle30m
  private readonly intervalMs = 30 * 60 * 1000

  private prevConfirmedSignalType?: BollingerSignalType
  private prevRealtimeSignalType?: BollingerSignalType

  constructor(symbol: string) {
    this.symbol = symbol
    this.initialize()
  }

  /* ============================================================
   * Preload
   * ============================================================ */

  private async initialize() {
    try {
      const closes = await preload30mCloses(this.symbol, 50)

      this.closes = closes

      console.log('[BB_PRELOAD_DONE]', {
        symbol: this.symbol,
        loaded: closes.length,
      })
    } catch (e) {
      console.error('[BB_PRELOAD_FAILED]', e)
    }
  }

  /* ============================================================
   * Utilities
   * ============================================================ */

  private getOpenTime(ts: number) {
    return Math.floor(ts / this.intervalMs) * this.intervalMs
  }

  private pushClose(close: number) {
    this.closes.push(close)

    if (this.closes.length > 300) {
      this.closes.shift()
    }
  }

  /* ============================================================
   * MAIN UPDATE
   * ============================================================ */

  update(
    tick: PriceTick,
    volume = 0,
  ): {
    finished?: Candle30m
    confirmedSignal?: ConfirmedBBSignal
    liveCommentary?: LiveBollingerCommentary
  } {
    const openTime = this.getOpenTime(tick.ts)

    if (!this.current || this.current.openTime !== openTime) {
      const finished = this.current

      let confirmedSignal: ConfirmedBBSignal | undefined

      if (finished) {
        this.pushClose(finished.close)

        const bbConfirmed = calculateBollingerBands({
          closes: this.closes,
        })

        if (bbConfirmed.isReady) {
          const result = evaluateConfirmedBollinger({
            open: finished.open,
            high: finished.high,
            low: finished.low,
            close: finished.close,
            upperBand: bbConfirmed.upperBand,
            lowerBand: bbConfirmed.lowerBand,
            prevSignalType: this.prevConfirmedSignalType,
          })

          if (result.enabled) {
            confirmedSignal = {
              type: 'BB_SIGNAL',
              symbol: this.symbol,
              timeframe: '30m',
              signalType: result.signalType,
              candle: finished,
              bands: {
                upperBand: bbConfirmed.upperBand,
                lowerBand: bbConfirmed.lowerBand,
              },
              confirmed: true,
              at: Date.now(),
            }

            this.prevConfirmedSignalType = result.signalType
          }
        }

        const macdResult = calculateMACD(this.closes)

        if (macdResult) {
          setLastMACD(this.symbol, macdResult)
        }
      }

      this.current = {
        openTime,
        closeTime: openTime + this.intervalMs,
        open: tick.price,
        high: tick.price,
        low: tick.price,
        close: tick.price,
        volume,
      }

      return { finished, confirmedSignal }
    }

    this.current.high = Math.max(this.current.high, tick.price)
    this.current.low = Math.min(this.current.low, tick.price)
    this.current.close = tick.price
    this.current.volume += volume

    const realtimeCloses = [...this.closes, this.current.close]

    const bbRealtime = calculateBollingerBands({
      closes: realtimeCloses,
    })

    if (!bbRealtime.isReady) {
      return {}
    }

    const rtResult = evaluateRealtimeBollinger({
      open: this.current.open,
      high: this.current.high,
      low: this.current.low,
      close: this.current.close,
      upperBand: bbRealtime.upperBand,
      lowerBand: bbRealtime.lowerBand,
      prevSignalType: this.prevRealtimeSignalType,
    })

    if (!rtResult.enabled) {
      return {}
    }

    this.prevRealtimeSignalType = rtResult.signalType

    const liveCommentary: LiveBollingerCommentary = {
      type: 'BB_LIVE_COMMENTARY',
      symbol: this.symbol,
      timeframe: '30m',
      signalType: rtResult.signalType,
      candle: this.current,
      bands: {
        upperBand: bbRealtime.upperBand,
        lowerBand: bbRealtime.lowerBand,
      },
      confirmed: false,
      at: Date.now(),
    }

    return { liveCommentary }
  }
}
