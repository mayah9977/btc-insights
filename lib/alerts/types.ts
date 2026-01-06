export type AlertCondition =
  | 'ABOVE'
  | 'BELOW'
  | 'REACH'
  | 'PERCENT'
  | 'RSI_OVER'
  | 'RSI_UNDER'

export type RepeatMode = 'ONCE' | 'REPEAT'

export type PriceAlert = {
  id: string
  userId: string
  exchange: 'BINANCE'
  symbol: string

  // PRICE
  targetPrice?: number

  // %
  percent?: number
  basePrice?: number

  // RSI
  rsi?: number

  condition: AlertCondition
  enabled: boolean
  repeatMode: RepeatMode
  cooldownMs: number

  triggered: boolean
  lastTriggeredAt?: number

  createdAt: number
  memo?: string
}
