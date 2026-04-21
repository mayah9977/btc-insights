'use client'

import { toast } from 'react-hot-toast'
import AlertToastCard from './AlertToastCard'

export function renderAlertToast(payload: {
  symbol: string
  price: number
}) {
  toast.custom(
    t => (
      <AlertToastCard
        t={t}
        type="BTC"
        symbol={payload.symbol}
        price={payload.price}
      />
    ),
    {
      position: 'bottom-right',
      duration: 7000,
    },
  )
}

export function renderIndicatorToast(data: {
  symbol: string
  indicator: string
  label: string
  signal: string
  value: number
}) {
  toast.custom(
    t => (
      <AlertToastCard
        t={t}
        type="INDICATOR"
        symbol={data.symbol}
        indicator={data.indicator}
        label={data.label}
        signal={data.signal}
        value={data.value}
      />
    ),
    {
      position: 'bottom-right',
      duration: 7000,
    },
  )
}
