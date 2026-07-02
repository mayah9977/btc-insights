// app/[locale]/alerts/components/AlertToastCard.tsx

'use client'

import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  animate,
} from 'framer-motion'

import { useEffect } from 'react'

import { usePathname, useRouter } from 'next/navigation'

import { toast } from 'react-hot-toast'

import {
  ArrowUpRight,
  ArrowDownRight,
  Activity,
} from 'lucide-react'

import { stopNotificationLoop } from '@/lib/alerts/alertsSSEStore'

type Props = {
  t: {
    id: string
    visible: boolean
  }

  createdAt?: number

  durationMs?: number

  onDismiss?: () => void

  type:
    | 'BTC'
    | 'INDICATOR'
    | 'INSTITUTIONAL'

  symbol: string

  price?: number

  label?: string

  indicator?: string

  signal?: string

  value?: number

  timeframe?: '15m' | '1h'
}

function getIndicatorToneClass(
  type: Props['type'],
  indicator?: string,
) {
  if (type !== 'INDICATOR') {
    return 'bg-gradient-to-br from-indigo-500/40 via-purple-500/30 to-cyan-400/30 shadow-[0_0_35px_rgba(99,102,241,0.45)]'
  }

  const normalized =
    indicator?.toUpperCase() ?? ''

  if (normalized.includes('RSI')) {
    return 'bg-gradient-to-br from-red-500/40 via-pink-500/30 to-rose-400/30 shadow-[0_0_35px_rgba(244,63,94,0.45)]'
  }

  if (normalized.includes('MACD')) {
    return 'bg-gradient-to-br from-blue-500/40 via-cyan-500/30 to-sky-400/30 shadow-[0_0_35px_rgba(34,211,238,0.45)]'
  }

  if (normalized.includes('EMA')) {
    return 'bg-gradient-to-br from-amber-500/40 via-yellow-500/30 to-orange-400/30 shadow-[0_0_35px_rgba(251,191,36,0.45)]'
  }

  return 'bg-gradient-to-br from-indigo-500/40 via-purple-500/30 to-cyan-400/30 shadow-[0_0_35px_rgba(99,102,241,0.45)]'
}

function getSignalDisplayLabel(args: {
  indicator?: string
  signal?: string
  timeframe?: '15m' | '1h'
  fallback?: string
}) {
  const {
    indicator,
    signal,
    timeframe,
    fallback,
  } = args

  const structureMode =
    timeframe === '1h'

  const SIGNAL_LABELS: Record<
    string,
    Record<string, string>
  > = {
    RSI: {
      RSI_OVERBOUGHT: structureMode
        ? 'Structure Overheat(과매수)'
        : 'Overbought(과매수)',

      RSI_OVERSOLD: structureMode
        ? 'Structure Compression(과매도)'
        : 'Oversold(과매도)',
    },

    MACD: {
      GOLDEN_CROSS: structureMode
        ? 'Structure Alignment(골든크로스)'
        : 'Golden Cross(골든크로스)',

      DEAD_CROSS: structureMode
        ? 'Directional Structure Shift(데드크로스)'
        : 'Dead Cross(데드크로스)',
    },

    EMA: {
      BULLISH_TREND: structureMode
        ? 'Higher Timeframe Structure Shift(상방추세전환)'
        : 'Trend Cross Signal(상방 추세 교차 신호)',

      BEARISH_TREND: structureMode
        ? 'Higher Timeframe Structure Shift(하방추세전환)'
        : 'Trend Cross Signal(하방추세전환)',
    },
  }

  if (
    indicator &&
    signal &&
    SIGNAL_LABELS[indicator]?.[signal]
  ) {
    return SIGNAL_LABELS[indicator][signal]
  }

  return fallback ?? signal ?? ''
}

export default function AlertToastCard({
  t,
  createdAt,
  durationMs,
  onDismiss,
  type,
  symbol,
  price,
  label,
  indicator,
  signal,
  value,
  timeframe,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()

  const isUp =
    signal
      ?.toLowerCase()
      .includes('golden') ||
    label?.includes('상승')

  const count = useMotionValue(0)

  const rounded = useTransform(
    count,
    latest =>
      Math.floor(
        latest,
      ).toLocaleString(),
  )

  useEffect(() => {
    if (price) {
      const controls = animate(
        count,
        price,
        {
          duration: 1.2,
          ease: 'easeOut',
        },
      )

      return controls.stop
    }

    return undefined
  }, [count, price])

  useEffect(() => {
    if (
      typeof window === 'undefined'
    ) {
      return undefined
    }

    if (
      createdAt === undefined ||
      durationMs === undefined
    ) {
      return undefined
    }

    const dismissToast = () => {
      onDismiss?.()
      toast.dismiss(t.id)
    }

    const cleanupIfExpired = () => {
      const expired =
        Date.now() - createdAt >=
        durationMs

      if (expired) {
        dismissToast()
      }
    }

    cleanupIfExpired()

    const remainingMs = Math.max(
      durationMs -
        (Date.now() - createdAt),
      0,
    )

    const timer =
      window.setTimeout(() => {
        dismissToast()
      }, remainingMs)

    const handleVisibilityChange =
      () => {
        if (
          document.visibilityState ===
          'visible'
        ) {
          cleanupIfExpired()
        }
      }

    window.addEventListener(
      'focus',
      cleanupIfExpired,
    )

    window.addEventListener(
      'pageshow',
      cleanupIfExpired,
    )

    document.addEventListener(
      'visibilitychange',
      handleVisibilityChange,
    )

    return () => {
      window.clearTimeout(timer)

      window.removeEventListener(
        'focus',
        cleanupIfExpired,
      )

      window.removeEventListener(
        'pageshow',
        cleanupIfExpired,
      )

      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange,
      )
    }
  }, [
    createdAt,
    durationMs,
    onDismiss,
    t.id,
  ])

  /* =========================
     🔥 OK BUTTON HANDLER
  ========================= */
  const handleConfirm = (
    e: React.MouseEvent,
  ) => {
    e.stopPropagation()

    onDismiss?.()

    toast.dismiss(t.id)

    stopNotificationLoop()

    if (type === 'BTC') {
      router.push('/ko/alerts')
      return
    }

    if (
      type === 'INSTITUTIONAL'
    ) {
      const segments = pathname.split('/').filter(Boolean)
      const locale = segments[0] ?? 'ko'
      const marketBase = `/${locale}/market`
      const casinoBase = `/${locale}/casino`
      const basePath =
        pathname === casinoBase ||
        pathname.startsWith(`${casinoBase}/`)
          ? casinoBase
          : marketBase

      router.push(`${basePath}/vip`)
      return
    }

    router.push(
      '/ko/alerts?tab=indicator',
    )
  }

  const timeframeLabel =
    timeframe === '1h'
      ? '1H'
      : timeframe === '15m'
        ? '15M'
        : null

  const isStructureLayer =
    timeframe === '1h'

  const timeframeTone =
    isStructureLayer
      ? 'border-cyan-400/30 bg-cyan-500/12 text-cyan-200 shadow-[0_0_16px_rgba(34,211,238,0.18)]'
      : 'border-indigo-400/30 bg-indigo-500/12 text-indigo-200 shadow-[0_0_16px_rgba(129,140,248,0.18)]'

  const layerLabel =
    isStructureLayer
      ? 'Structure Layer(추세 구조)'
      : 'Momentum Layer(모멘텀 흐름)'

  const layerDescription =
    isStructureLayer
      ? 'Higher timeframe directional structure(추세 방향 구조)'
      : 'Realtime momentum transition(실시간 모멘텀 전환)'

  const displayLabel =
    getSignalDisplayLabel({
      indicator,
      signal,
      timeframe,
      fallback: label,
    })

  const outerToneClass =
    getIndicatorToneClass(
      type,
      indicator,
    )

  return (
    <AnimatePresence>
      {t.visible && (
        <motion.div
          initial={{
            x: 120,
            opacity: 0,
            scale: 0.95,
          }}
          animate={{
            x: 0,
            opacity: 1,
            scale: 1,
          }}
          exit={{
            x: 120,
            opacity: 0,
            scale: 0.95,
          }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 20,
          }}
          className={`
            relative
            w-full
            max-w-[360px]
            rounded-2xl
            p-[1px]
            ${outerToneClass}
          `}
        >
          <motion.div
            whileHover={{
              scale: 1.03,
            }}
            className="
              relative
              rounded-2xl
              bg-[#0B0F19]/95
              p-4
              backdrop-blur-xl
            "
          >
            {/* =========================
               🔥 OK BUTTON
            ========================= */}
            <button
              onClick={handleConfirm}
              className="
                absolute
                right-3
                top-3
                z-20
                min-h-[32px]
                min-w-[52px]
                rounded-full
                border
                border-emerald-400/20
                bg-emerald-500/10
                px-3
                text-[11px]
                font-semibold
                text-emerald-300
                backdrop-blur-md
                transition
                hover:bg-emerald-500/20
                hover:text-emerald-200
                active:scale-95
              "
            >
              OK
            </button>

            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Activity size={14} />

                {type === 'BTC'
                  ? 'BTC PRICE ALERT(BTC 가격알림)'
                  : 'MARKET SIGNAL(시장 시그널)'}
              </div>

              {type === 'BTC' && (
                <div
                  className={`flex items-center ${
                    isUp
                      ? 'text-green-400'
                      : 'text-red-400'
                  }`}
                >
                  {isUp ? (
                    <ArrowUpRight size={16} />
                  ) : (
                    <ArrowDownRight size={16} />
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pr-14">
              <div className="truncate text-lg font-semibold text-white">
                {symbol}
              </div>

              {type === 'INDICATOR' &&
                timeframeLabel && (
                  <div
                    className={`
                      shrink-0
                      rounded-md
                      border
                      px-2.5
                      py-0.5
                      text-[10px]
                      font-bold
                      tracking-[0.12em]
                      ${timeframeTone}
                    `}
                  >
                    {timeframeLabel}
                  </div>
                )}
            </div>

            {type === 'BTC' ? (
              <>
                <motion.div
                  initial={{
                    opacity: 0,
                  }}
                  animate={{
                    opacity: 1,
                  }}
                  transition={{
                    delay: 0.2,
                  }}
                  className="mt-1 text-xs text-gray-400"
                >
                  설정한 목표 가격 도달
                </motion.div>

                <div className="mt-1 text-3xl font-bold tracking-tight text-white">
                  $
                  <motion.span>
                    {rounded}
                  </motion.span>
                </div>

                <div className="mt-1 text-xs text-gray-500">
                  목표가에 도달했습니다
                </div>
              </>
            ) : (
              <>
                <div
                  className="
                    mt-2
                    flex
                    flex-wrap
                    items-center
                    gap-2
                  "
                >
                  <div className="max-w-full truncate text-sm font-semibold text-white">
                    {indicator}
                  </div>

                  {timeframeLabel && (
                    <div
                      className={`
                        rounded-md
                        border
                        px-2
                        py-0.5
                        text-[10px]
                        font-semibold
                        tracking-[0.08em]
                        ${
                          isStructureLayer
                            ? 'border-cyan-400/20 bg-cyan-400/8 text-cyan-200'
                            : 'border-indigo-400/20 bg-indigo-400/8 text-indigo-200'
                        }
                      `}
                    >
                      {layerLabel}
                    </div>
                  )}
                </div>

                <motion.div
                  initial={{
                    opacity: 0,
                    y: 4,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    delay: 0.2,
                  }}
                  className={`
                    mt-2
                    break-words
                    text-lg
                    font-bold
                    ${
                      isStructureLayer
                        ? 'text-cyan-200'
                        : 'text-indigo-200'
                    }
                  `}
                >
                  {displayLabel}
                </motion.div>

                <div
                  className="
                    mt-1
                    text-xs
                    leading-relaxed
                    text-gray-400
                  "
                >
                  {layerDescription}
                </div>

                {label &&
                  label !==
                    displayLabel && (
                    <div
                      className="
                        mt-2
                        rounded-lg
                        border
                        border-white/10
                        bg-white/[0.035]
                        px-2.5
                        py-1.5
                        text-[11px]
                        leading-relaxed
                        text-zinc-300
                      "
                    >
                      {label}
                    </div>
                  )}

                {signal && (
                  <div
                    className="
                      mt-2
                      inline-flex
                      max-w-full
                      items-center
                      rounded-lg
                      border
                      border-zinc-700
                      bg-zinc-900/60
                      px-2.5
                      py-1
                      text-[11px]
                      font-medium
                      text-zinc-300
                    "
                  >
                    <span className="truncate">
                      {signal}
                    </span>
                  </div>
                )}

                {value !==
                  undefined && (
                  <div className="mt-2 text-xs text-gray-500">
                    value:{' '}
                    {value.toFixed(2)}
                  </div>
                )}
              </>
            )}

            <div
              className="
                pointer-events-none
                absolute
                inset-0
                rounded-2xl
                bg-gradient-to-r
                from-transparent
                via-white/5
                to-transparent
                opacity-30
                animate-pulse
              "
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
