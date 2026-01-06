export type RealtimeEvent =
  | {
      type: 'PRICE_TICK'
      symbol: string
      price: number
      ts: number
    }
  | {
      type: 'OI_TICK'
      symbol: string
      openInterest: number
      ts: number
    }
  | {
      type: 'ALERT_TRIGGERED'
      alertId: string
      symbol: string
      price: number
      ts: number
    }
