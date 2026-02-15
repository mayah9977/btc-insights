// path: lib/market/actionGate/liveBollingerCommentary.ts

import { BollingerSignalType } from './signalType'
import type { Candle30m, BollingerBands30m } from './signalType'

export type LiveBollingerCommentary = {
  type: 'BB_LIVE_COMMENTARY'
  symbol: string
  timeframe: '30m'
  signalType: BollingerSignalType
  candle: Candle30m
  bands: BollingerBands30m
  confirmed: false
  at: number
}
