// app/[locale]/alerts/components/AlertToastRenderer.tsx

'use client'

import { toast } from 'react-hot-toast'
import type { ReactElement } from 'react'
import AlertToastCard from './AlertToastCard'

const DEFAULT_TOAST_DURATION_MS = 7000
const LONG_TOAST_DURATION_MS = 8500
const STALE_GRACE_MS = 1000

type ActiveAlertToast = {
  id: string
  createdAt: number
  durationMs: number
}

type RenderTrackedAlertToastArgs = {
  id: string
  createdAt: number
  durationMs: number
  dismiss: () => void
}

const activeAlertToasts = new Map<
  string,
  ActiveAlertToast
>()

let lifecycleInstalled = false

function createToastId(prefix: string) {
  return `${prefix}:${Date.now()}:${Math.random()
    .toString(36)
    .slice(2)}`
}

function dismissTrackedToast(id: string) {
  toast.dismiss(id)
  activeAlertToasts.delete(id)
}

function cleanupExpiredAlertToasts() {
  const now = Date.now()

  for (const [id, item] of activeAlertToasts.entries()) {
    const expired =
      now - item.createdAt >=
      item.durationMs + STALE_GRACE_MS

    if (expired) {
      dismissTrackedToast(id)
    }
  }
}

function installAlertToastLifecycle() {
  if (typeof window === 'undefined') {
    return
  }

  if (lifecycleInstalled) {
    return
  }

  lifecycleInstalled = true

  const handleResume = () => {
    cleanupExpiredAlertToasts()
  }

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      cleanupExpiredAlertToasts()
    }
  }

  document.addEventListener(
    'visibilitychange',
    handleVisibilityChange,
  )

  window.addEventListener(
    'focus',
    handleResume,
  )

  window.addEventListener(
    'pageshow',
    handleResume,
  )
}

function renderTrackedAlertToast(
  prefix: string,
  durationMs: number,
  render: (
    args: RenderTrackedAlertToastArgs,
  ) => ReactElement,
) {
  installAlertToastLifecycle()

  cleanupExpiredAlertToasts()

  const id = createToastId(prefix)
  const createdAt = Date.now()

  activeAlertToasts.set(id, {
    id,
    createdAt,
    durationMs,
  })

  const dismiss = () => {
    dismissTrackedToast(id)
  }

  toast.custom(
    render({
      id,
      createdAt,
      durationMs,
      dismiss,
    }),
    {
      id,
      position: 'bottom-right',
      duration: durationMs,
    },
  )

  if (typeof window !== 'undefined') {
    window.setTimeout(() => {
      dismissTrackedToast(id)
    }, durationMs + STALE_GRACE_MS)
  }
}

/* =========================
   BTC ALERT
========================= */
export function renderAlertToast(payload: {
  symbol: string
  price: number
}) {
  renderTrackedAlertToast(
    'btc-alert-toast',
    DEFAULT_TOAST_DURATION_MS,
    ({
      id,
      createdAt,
      durationMs,
      dismiss,
    }) => (
      <AlertToastCard
        t={{
          id,
          visible: true,
        }}
        createdAt={createdAt}
        durationMs={durationMs}
        onDismiss={dismiss}
        type="BTC"
        symbol={payload.symbol}
        price={payload.price}
      />
    ),
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
  const timeframe =
    data.timeframe ?? '15m'

  const timeframeLabel =
    timeframe === '1h'
      ? '1H Structure(추세구조)'
      : '15M Momentum(모멘텀흐름)'

  const signalLabel =
    timeframe === '1h'
      ? `${data.signal} · Structure Alignment(추세 정렬)`
      : `${data.signal} · Momentum Shift(단기 방향 전환)`

  const durationMs =
    timeframe === '1h'
      ? LONG_TOAST_DURATION_MS
      : DEFAULT_TOAST_DURATION_MS

  renderTrackedAlertToast(
    'indicator-toast',
    durationMs,
    ({
      id,
      createdAt,
      durationMs,
      dismiss,
    }) => (
      <AlertToastCard
        t={{
          id,
          visible: true,
        }}
        createdAt={createdAt}
        durationMs={durationMs}
        onDismiss={dismiss}
        type="INDICATOR"
        symbol={data.symbol}
        indicator={`${data.indicator} · ${timeframeLabel}`}
        label={data.label}
        signal={signalLabel}
        value={data.value}
        timeframe={timeframe}
      />
    ),
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
  const patternLabelMap: Record<
    string,
    string
  > = {
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

    BUILDING:
      'Building Pressure(압력 증가 중)',

    AGGRESSIVE:
      'Aggressive Flow(강한 세력 유입)',

    EXTREME:
      'Persistent Institutional Flow(지속적 세력 유입)',
  }

  const label =
    patternLabelMap[data.pattern] ??
    data.pattern

  const intensity =
    intensityLabelMap[data.intensity] ??
    data.intensity

  renderTrackedAlertToast(
    'institutional-toast',
    LONG_TOAST_DURATION_MS,
    ({
      id,
      createdAt,
      durationMs,
      dismiss,
    }) => (
      <AlertToastCard
        t={{
          id,
          visible: true,
        }}
        createdAt={createdAt}
        durationMs={durationMs}
        onDismiss={dismiss}
        type="INSTITUTIONAL"
        symbol="BTCUSDT"
        indicator="INSTITUTIONAL FLOW(세력 흐름 감지)"
        label={label}
        signal={intensity}
        value={undefined}
      />
    ),
  )
}
