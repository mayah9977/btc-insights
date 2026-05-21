// app/[locale]/alerts/components/AlertToastRenderer.tsx

'use client'

import { toast } from 'react-hot-toast'
import AlertToastCard from './AlertToastCard'

/* =========================
   BTC ALERT
========================= */
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

/* =========================
   INDICATOR
========================= */
export function renderIndicatorToast(data: {
  symbol: string
  indicator: string
  label: string
  signal: string
  value: number
  timeframe?: '15m' | '1h'
}) {
  const timeframe = data.timeframe ?? '15m'

  const timeframeLabel =
    timeframe === '1h'
      ? '1H Structure(추세구조)'
      : '15M Momentum(모멘텀흐름)'

  const signalLabel =
    timeframe === '1h'
      ? `${data.signal} · Structure Alignment(추세 정렬)`
      : `${data.signal} · Momentum Shift(단기 방향 전환)`

  toast.custom(
    t => (
      <AlertToastCard
        t={t}
        type="INDICATOR"
        symbol={data.symbol}
        indicator={`${data.indicator} · ${timeframeLabel}`}
        label={data.label}
        signal={signalLabel}
        value={data.value}
      />
    ),
    {
      position: 'bottom-right',
      duration: timeframe === '1h' ? 8500 : 7000,
    },
  )
}

/* =========================
   INSTITUTIONAL PATTERN
========================= */
export function renderInstitutionalPatternToast(data: {
  pattern: string
  intensity: string
  risk: string
  summary: string
}) {
  const patternLabelMap: Record<string, string> = {
    LONG_PRESSURE_BUILDING:
      'Long Pressure Building(상승압력증가)',

    SHORT_PRESSURE_BUILDING:
      'Short Pressure Building(하락압력증가)',

    LONG_SQUEEZE_RISK:
      'Long Squeeze Risk(롱 과열 위험)',

    SHORT_SQUEEZE_RISK:
      'Short Squeeze Risk(숏 과열 위험)',

    WHALE_DISTRIBUTION:
      'Whale Distribution(세력 물량 정리움직임)',

    INSTITUTIONAL_ABSORPTION:
      'Institutional Absorption(세력 물량 흡수움직임)',

    LIQUIDITY_SWEEP_RISK:
      'Liquidity Sweep Risk(청산 유도 위험)',
  }

  const intensityLabelMap: Record<
    string,
    string
  > = {
    WEAK: 'Weak Pressure(약한 압력)',
    BUILDING: 'Building Pressure(압력 증가 중)',
    AGGRESSIVE: 'Aggressive Flow(강한 세력 유입)',
    EXTREME:
      'Persistent Institutional Flow(지속적 세력 유입)',
  }

  const label =
    patternLabelMap[data.pattern] ??
    data.pattern

  const intensity =
    intensityLabelMap[data.intensity] ??
    data.intensity

  toast.custom(
    t => (
      <AlertToastCard
        t={t}
        type="INSTITUTIONAL"
        symbol="BTCUSDT"
        indicator="INSTITUTIONAL FLOW(세력 흐름 감지)"
        label={label}
        signal={intensity}
        value={undefined}
      />
    ),
    {
      position: 'bottom-right',
      duration: 8500,
    },
  )
}
