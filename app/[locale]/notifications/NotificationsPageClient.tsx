// app/[locale]/notifications/NotificationsPageClient.tsx

'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ReactNode, MouseEvent } from 'react'
import { useRouter } from 'next/navigation'
import {
  AnimatePresence,
  motion,
  type Transition,
} from 'framer-motion'
import type {
  NotificationViewItem,
} from '@/lib/notification/notificationStore'
import { useNotificationStore } from '@/lib/notification/notificationStore'
import { stopNotificationLoop } from '@/lib/alerts/alertsSSEStore'

type Props = {
  initialNotifications: NotificationViewItem[]
  initialUnreadCount: number
  isVIP: boolean
}

type IndicatorGroupKey =
  | 'RSI'
  | 'MACD'
  | 'EMA'
  | 'OTHER'

type HistoryLayer =
  | 'PRICE'
  | 'MOMENTUM'
  | 'STRUCTURE'
  | 'FLOW'
  | 'GENERAL'

type NotificationMeta = {
  layer: HistoryLayer
  timeframeLabel: '15M' | '1H' | null
  layerLabel: string
  toneClass: string
  badgeClass: string
  signalLabel: string
  subtitle: string
}

const EASE = [0.22, 1, 0.36, 1] as const

const CARD_TRANSITION: Transition = {
  duration: 0.24,
  ease: EASE,
}

const ACCORDION_TRANSITION: Transition = {
  duration: 0.28,
  ease: EASE,
}

const LAYOUT_TRANSITION: Transition = {
  duration: 0.24,
  ease: EASE,
}

function normalizeTimeframe(
  value: unknown,
): '15m' | '1h' {
  return value === '1h' ? '1h' : '15m'
}

function getIndicatorSignalLabel(data: any) {
  const timeframe = normalizeTimeframe(
    data?.timeframe,
  )

  const structureMode = timeframe === '1h'

  const SIGNAL_MAP: Record<
    string,
    Record<string, string>
  > = {
    RSI: {
      RSI_OVERBOUGHT: structureMode
        ? 'Structure Overheat(구조 과열)'
        : 'Overbought(과매수)',

      RSI_OVERSOLD: structureMode
        ? 'Structure Compression(구조 압축)'
        : 'Oversold(과매도)',
    },

    MACD: {
      GOLDEN_CROSS: structureMode
        ? 'Structure Alignment(추세 정렬)'
        : 'Golden Cross(골든크로스)',

      DEAD_CROSS: structureMode
        ? 'Directional Structure Shift(추세 방향 전환)'
        : 'Dead Cross(데드크로스)',
    },

    EMA: {
      BULLISH_TREND: structureMode
        ? 'Higher Timeframe Structure Shift(추세 전환)'
        : 'Trend Cross Signal(추세 교차 신호)',

      BEARISH_TREND: structureMode
        ? 'Higher Timeframe Structure Shift(추세 전환)'
        : 'Trend Cross Signal(추세 교차 신호)',
    },
  }

  return (
    SIGNAL_MAP[data?.indicator]?.[
      data?.signal
    ] ??
    `${data?.indicator} ${data?.signal}`
  )
}

function getIndicatorLabel(data: any) {
  return getIndicatorSignalLabel(data)
}

function formatTime(ts: number) {
  const now = Date.now()
  const diff = now - ts

  const sec = Math.floor(diff / 1000)
  const min = Math.floor(sec / 60)
  const hour = Math.floor(min / 60)

  if (sec < 60) return '방금 전'
  if (min < 60) return `${min}분 전`
  if (hour < 24) return `${hour}시간 전`

  const d = new Date(ts)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(
    2,
    '0',
  )
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(
    2,
    '0',
  )

  return `${yyyy}.${mm}.${dd} ${hh}:${mi}`
}

function getIndicatorGroup(
  title: string,
): IndicatorGroupKey {
  if (title.includes('RSI')) return 'RSI'
  if (title.includes('MACD')) return 'MACD'
  if (title.includes('EMA')) return 'EMA'
  return 'OTHER'
}

function getNotificationMeta(
  item: NotificationViewItem,
): NotificationMeta {
  const source = `${item.title} ${item.body}`

  if (item.type === 'BTC_ALERT') {
    return {
      layer: 'PRICE',
      timeframeLabel: null,
      layerLabel: 'PRICE ALERT(가격 알람)',
      toneClass:
        item.read
          ? 'border-white/10 bg-white/[0.04]'
          : 'border-yellow-500/20 bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-yellow-500/[0.06]',
      badgeClass:
        'border-yellow-400/20 bg-yellow-500/10 text-yellow-200',
      signalLabel: item.body,
      subtitle: 'BTC price notification(BTC 가격 알림)',
    }
  }

  if (item.type === 'INSTITUTIONAL_PATTERN') {
    return {
      layer: 'FLOW',
      timeframeLabel: null,
      layerLabel: 'FLOW LAYER(세력 흐름)',
      toneClass:
        item.read
          ? 'border-cyan-400/10 bg-cyan-400/[0.035]'
          : 'border-cyan-400/20 bg-gradient-to-br from-cyan-400/[0.1] via-white/[0.04] to-emerald-400/[0.07]',
      badgeClass:
        'border-cyan-400/25 bg-cyan-500/10 text-cyan-200',
      signalLabel: item.body,
      subtitle:
        'Institutional pressure(세력 압력) / positioning flow(세력 포지션 흐름)',
    }
  }

  const isOneHour =
    source.includes('1H') ||
    source.includes('1h') ||
    source.includes('[1H]')

  const isFifteenMinute =
    source.includes('15M') ||
    source.includes('15m') ||
    source.includes('[15M]')

  if (item.type === 'INDICATOR') {
    const timeframeLabel = isOneHour
      ? '1H'
      : isFifteenMinute
        ? '15M'
        : null

    const structureMode = timeframeLabel === '1H'

    return {
      layer: structureMode
        ? 'STRUCTURE'
        : 'MOMENTUM',
      timeframeLabel:
        timeframeLabel ?? '15M',
      layerLabel: structureMode
        ? 'STRUCTURE LAYER(추세 구조)'
        : 'MOMENTUM LAYER(모멘텀 흐름)',
      toneClass:
        item.read
          ? structureMode
            ? 'border-cyan-400/10 bg-cyan-400/[0.035]'
            : 'border-indigo-400/10 bg-indigo-400/[0.035]'
          : structureMode
            ? 'border-cyan-400/20 bg-gradient-to-br from-cyan-400/[0.1] via-white/[0.04] to-blue-500/[0.06]'
            : 'border-indigo-400/20 bg-gradient-to-br from-indigo-400/[0.1] via-white/[0.04] to-purple-500/[0.06]',
      badgeClass: structureMode
        ? 'border-cyan-400/25 bg-cyan-500/10 text-cyan-200'
        : 'border-indigo-400/25 bg-indigo-500/10 text-indigo-200',
      signalLabel: item.body,
      subtitle: structureMode
        ? 'Higher timeframe directional structure(추세 방향 구조)'
        : 'Realtime momentum transition(실시간 추세 전환)',
    }
  }

  return {
    layer: 'GENERAL',
    timeframeLabel: null,
    layerLabel: item.type,
    toneClass:
      item.read
        ? 'border-white/10 bg-white/[0.04]'
        : 'border-yellow-500/20 bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-yellow-500/[0.06]',
    badgeClass:
      'border-white/10 bg-white/5 text-gray-300',
    signalLabel: item.body,
    subtitle: item.type,
  }
}

function AccordionHeader({
  icon,
  title,
  count,
  subtitle,
  open,
  onClick,
}: {
  icon: string
  title: string
  count: number
  subtitle?: string
  open: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-3 flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left backdrop-blur-xl transition hover:bg-white/[0.06]"
      aria-expanded={open}
    >
      <div className="flex items-center gap-3">
        <span className="text-base">{icon}</span>

        <div>
          <div className="text-sm font-semibold text-white">
            {title}
          </div>

          {subtitle && (
            <div className="text-xs text-gray-400">
              {subtitle}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-gray-300">
          {count}
        </span>

        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={CARD_TRANSITION}
          className="text-xs text-gray-400"
        >
          ▼
        </motion.span>
      </div>
    </button>
  )
}

function AccordionBody({
  open,
  children,
}: {
  open: boolean
  children: ReactNode
}) {
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{
            height: 0,
            opacity: 0,
          }}
          animate={{
            height: 'auto',
            opacity: 1,
          }}
          exit={{
            height: 0,
            opacity: 0,
          }}
          transition={ACCORDION_TRANSITION}
          className="overflow-hidden"
        >
          <motion.div
            layout
            transition={LAYOUT_TRANSITION}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function NotificationCard({
  item,
  onRead,
  onDelete,
}: {
  item: NotificationViewItem
  onRead: (id: string) => void
  onDelete: (id: string) => void
}) {
  const router = useRouter()
  const meta = getNotificationMeta(item)

  const handleConfirm = (
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation()

    void onRead(item.id)
    stopNotificationLoop()

    if (item.type === 'BTC_ALERT') {
      router.push('/ko/alerts')
      return
    }

    if (item.type === 'INDICATOR') {
      router.push('/ko/alerts?tab=indicator')
      return
    }

    // MODIFIED: Institutional Flow notification routes to VIP casino page.
    if (item.type === 'INSTITUTIONAL_PATTERN') {
      router.push('/ko/casino/vip')
      return
    }

    router.push('/ko/notices')
  }

  return (
    <motion.div
      layout
      initial={{
        opacity: 0,
        y: 14,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={CARD_TRANSITION}
      onClick={() => void onRead(item.id)}
      className={`group relative mb-3 cursor-pointer overflow-hidden rounded-2xl border p-4 backdrop-blur-xl transition ${meta.toneClass}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {meta.timeframeLabel && (
              <span
                className={`rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-[0.14em] ${meta.badgeClass}`}
              >
                {meta.timeframeLabel}
              </span>
            )}

            <span
              className={`rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-[0.14em] ${meta.badgeClass}`}
            >
              {meta.layerLabel}
            </span>

            {!item.read && (
              <span className="h-2 w-2 shrink-0 rounded-full bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.8)]" />
            )}
          </div>

          <div className="mt-3 truncate text-sm font-semibold text-white">
            {item.title}
          </div>

          <div className="mt-1 text-sm leading-relaxed text-gray-300">
            {meta.signalLabel}
          </div>

          <div className="mt-2 text-[11px] leading-relaxed text-gray-500">
            {meta.subtitle}
          </div>
        </div>

        <div className="shrink-0 text-left sm:text-right">
          <div className="mb-2 flex items-center gap-2 sm:justify-end">
            <button
              type="button"
              onClick={handleConfirm}
              className="inline-flex min-h-[36px] min-w-[64px] items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/15 hover:text-emerald-200"
            >
              OK
            </button>

            <button
              type="button"
              onClick={event => {
                event.stopPropagation()
                void onDelete(item.id)
              }}
              className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-full border border-white/10 bg-white/5 text-[11px] text-gray-300 transition hover:bg-white/10 hover:text-white"
            >
              ❌
            </button>
          </div>

          <div className="text-xs text-gray-400">
            {formatTime(item.createdAt)}
          </div>

          <div className="mt-1 text-[10px] uppercase tracking-[0.16em] text-gray-500">
            {item.type}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function NotificationsPageClient({
  initialNotifications,
  initialUnreadCount,
  isVIP,
}: Props) {
  const notifications = useNotificationStore(
    state => state.notifications,
  )
  const unreadCount = useNotificationStore(
    state => state.unreadCount,
  )
  const setServerSnapshot =
    useNotificationStore(
      state => state.setServerSnapshot,
    )
  const pushIncoming = useNotificationStore(
    state => state.pushIncoming,
  )
  const markOneRead = useNotificationStore(
    state => state.markOneRead,
  )
  const deleteOne = useNotificationStore(
    state => state.deleteOne,
  )
  const deleteAll = useNotificationStore(
    state => state.deleteAll,
  )

  const [openSections, setOpenSections] =
    useState({
      btcAlert: true,
      indicator: true,
      institutional: true,
    })

  const [
    openIndicatorGroups,
    setOpenIndicatorGroups,
  ] = useState<
    Record<IndicatorGroupKey, boolean>
  >({
    RSI: true,
    MACD: true,
    EMA: true,
    OTHER: false,
  })

  useEffect(() => {
    setServerSnapshot({
      notifications: initialNotifications,
      unreadCount: initialUnreadCount,
      isVIP,
    })
  }, [
    initialNotifications,
    initialUnreadCount,
    isVIP,
    setServerSnapshot,
  ])

  useEffect(() => {
    const handleAlert = (event: Event) => {
      const detail = (event as CustomEvent)
        .detail

      pushIncoming({
        id: String(detail.alertId),
        type: 'BTC_ALERT',
        title: `${detail.symbol} price notification`,
        body: `Price ${detail.price} reached`,
        createdAt:
          detail.ts ?? Date.now(),
        read: false,
      })
    }

    const handleIndicator = (
      event: Event,
    ) => {
      const detail = (event as CustomEvent)
        .detail

      const timeframe =
        normalizeTimeframe(
          detail.timeframe,
        )

      const label = getIndicatorLabel({
        ...detail,
        timeframe,
      })

      const eventCandleTs =
        detail.eventCandleTs ??
        detail.ts ??
        Date.now()

      const notificationId =
        `indicator:${detail.symbol}:${timeframe}:${detail.indicator}:${detail.signal}:${eventCandleTs}`

      pushIncoming({
        id: notificationId,
        type: 'INDICATOR',
        title: `${timeframe.toUpperCase()} ${detail.indicator} signal`,
        body: label,
        createdAt:
          detail.ts ?? Date.now(),
        read: false,
      })
    }

    const handleInstitutionalPattern = (
      event: Event,
    ) => {
      const detail = (event as CustomEvent)
        .detail

      pushIncoming({
        id: `institutional-${detail.pattern}-${detail.confirmedCandleTs ?? detail.ts ?? Date.now()}`,
        type: 'INSTITUTIONAL_PATTERN',
        title:
          'Institutional Flow Signal',
        body: `${detail.pattern ?? 'Institutional Flow'} · ${detail.intensity ?? 'Flow Layer'}`,
        createdAt:
          detail.ts ?? Date.now(),
        read: false,
      })
    }

    window.addEventListener(
      'alert:triggered',
      handleAlert,
    )
    window.addEventListener(
      'indicator:triggered',
      handleIndicator,
    )
    window.addEventListener(
      'institutional-pattern:triggered',
      handleInstitutionalPattern,
    )

    return () => {
      window.removeEventListener(
        'alert:triggered',
        handleAlert,
      )
      window.removeEventListener(
        'indicator:triggered',
        handleIndicator,
      )
      window.removeEventListener(
        'institutional-pattern:triggered',
        handleInstitutionalPattern,
      )
    }
  }, [pushIncoming])

  const dedupedNotifications = useMemo(() => {
    const map = new Map<
      string,
      NotificationViewItem
    >()

    for (const item of notifications) {
      const key =
        item.id ||
        `${item.type}-${item.title}-${item.body}`

      const existing = map.get(key)

      if (
        !existing ||
        existing.createdAt < item.createdAt
      ) {
        map.set(key, item)
      }
    }

    return Array.from(map.values()).sort(
      (a, b) =>
        b.createdAt - a.createdAt,
    )
  }, [notifications])

  const groupedNotifications = useMemo(() => {
    const now = Date.now()
    const twelveHoursAgo =
      now - 12 * 60 * 60 * 1000

    const btcAlert: NotificationViewItem[] =
      []
    const indicator: NotificationViewItem[] =
      []
    const institutional: NotificationViewItem[] =
      []

    for (const item of dedupedNotifications) {
      if (item.createdAt < twelveHoursAgo) {
        continue
      }

      if (item.type === 'BTC_ALERT') {
        btcAlert.push(item)
      } else if (
        item.type === 'INDICATOR'
      ) {
        indicator.push(item)
      } else if (
        item.type ===
        'INSTITUTIONAL_PATTERN'
      ) {
        institutional.push(item)
      }
    }

    const indicatorGroups: Record<
      IndicatorGroupKey,
      NotificationViewItem[]
    > = {
      RSI: [],
      MACD: [],
      EMA: [],
      OTHER: [],
    }

    for (const item of indicator) {
      indicatorGroups[
        getIndicatorGroup(item.title)
      ].push(item)
    }

    return {
      btcAlert,
      indicator,
      institutional,
      indicatorGroups,
    }
  }, [dedupedNotifications])

  const toggleSection = (
    key:
      | 'btcAlert'
      | 'indicator'
      | 'institutional',
  ) => {
    setOpenSections(prev => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const toggleIndicatorGroup = (
    key: IndicatorGroupKey,
  ) => {
    setOpenIndicatorGroups(prev => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const visibleCount =
    groupedNotifications.btcAlert.length +
    groupedNotifications.indicator.length +
    groupedNotifications.institutional.length

  if (!isVIP) {
    return (
      <main className="min-h-screen bg-black px-4 py-20 text-white">
        <div className="mx-auto max-w-md text-center">
          <div className="rounded-2xl border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 to-white/5 p-8 backdrop-blur-xl">
            <div className="mb-4 text-3xl">
              🔒
            </div>

            <h2 className="text-xl font-semibold text-white">
              VIP 전용 기능입니다
            </h2>

            <p className="mt-2 text-sm text-gray-400">
              실시간 알림 히스토리는 VIP
              회원만 확인할 수 있습니다.
            </p>

            <button
              onClick={() =>
                (window.location.href =
                  '/ko/vip/upgrade')
              }
              className="mt-6 w-full rounded-xl bg-yellow-500 py-3 text-sm font-semibold text-black transition hover:bg-yellow-400"
            >
              VIP 업그레이드
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black px-4 py-20 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">
              Notification History(알림 히스토리)
            </h1>

            <p className="mt-1 text-sm text-gray-400">
              Momentum(모멘텀) / Structure(구조) /
              Flow Layer(세력 흐름) 알림을 최근 12시간
              기준으로 표시합니다.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-gray-200">
              unread {unreadCount}
            </span>

            <button
              onClick={() =>
                void deleteAll()
              }
              className="rounded-xl border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/15"
            >
              모두 삭제
            </button>
          </div>
        </div>

        <motion.div
          layout
          transition={LAYOUT_TRANSITION}
        >
          {groupedNotifications.btcAlert
            .length > 0 && (
            <section className="mb-6">
              <AccordionHeader
                icon="🔔"
                title="BTC ALERT"
                subtitle="BTC 가격 알림"
                count={
                  groupedNotifications
                    .btcAlert.length
                }
                open={
                  openSections.btcAlert
                }
                onClick={() =>
                  toggleSection(
                    'btcAlert',
                  )
                }
              />

              <AccordionBody
                open={
                  openSections.btcAlert
                }
              >
                <motion.div
                  layout
                  transition={
                    LAYOUT_TRANSITION
                  }
                >
                  {groupedNotifications.btcAlert.map(
                    item => (
                      <NotificationCard
                        key={item.id}
                        item={item}
                        onRead={
                          markOneRead
                        }
                        onDelete={
                          deleteOne
                        }
                      />
                    ),
                  )}
                </motion.div>
              </AccordionBody>
            </section>
          )}

          {groupedNotifications.indicator
            .length > 0 && (
            <section className="mb-6">
              <AccordionHeader
                icon="📊"
                title="INDICATOR LAYERS"
                subtitle="15M Momentum / 1H Structure"
                count={
                  groupedNotifications
                    .indicator.length
                }
                open={
                  openSections.indicator
                }
                onClick={() =>
                  toggleSection(
                    'indicator',
                  )
                }
              />

              <AccordionBody
                open={
                  openSections.indicator
                }
              >
                <motion.div
                  layout
                  transition={
                    LAYOUT_TRANSITION
                  }
                >
                  {groupedNotifications
                    .indicatorGroups.RSI
                    .length > 0 && (
                    <div className="mb-5">
                      <AccordionHeader
                        icon="🟣"
                        title="RSI"
                        subtitle="Momentum / Structure pressure zone"
                        count={
                          groupedNotifications
                            .indicatorGroups
                            .RSI
                            .length
                        }
                        open={
                          openIndicatorGroups
                            .RSI
                        }
                        onClick={() =>
                          toggleIndicatorGroup(
                            'RSI',
                          )
                        }
                      />

                      <AccordionBody
                        open={
                          openIndicatorGroups
                            .RSI
                        }
                      >
                        <motion.div
                          layout
                          transition={
                            LAYOUT_TRANSITION
                          }
                        >
                          {groupedNotifications.indicatorGroups.RSI.map(
                            item => (
                              <NotificationCard
                                key={
                                  item.id
                                }
                                item={
                                  item
                                }
                                onRead={
                                  markOneRead
                                }
                                onDelete={
                                  deleteOne
                                }
                              />
                            ),
                          )}
                        </motion.div>
                      </AccordionBody>
                    </div>
                  )}

                  {groupedNotifications
                    .indicatorGroups.MACD
                    .length > 0 && (
                    <div className="mb-5">
                      <AccordionHeader
                        icon="🔵"
                        title="MACD"
                        subtitle="Momentum transition / structure alignment"
                        count={
                          groupedNotifications
                            .indicatorGroups
                            .MACD
                            .length
                        }
                        open={
                          openIndicatorGroups
                            .MACD
                        }
                        onClick={() =>
                          toggleIndicatorGroup(
                            'MACD',
                          )
                        }
                      />

                      <AccordionBody
                        open={
                          openIndicatorGroups
                            .MACD
                        }
                      >
                        <motion.div
                          layout
                          transition={
                            LAYOUT_TRANSITION
                          }
                        >
                          {groupedNotifications.indicatorGroups.MACD.map(
                            item => (
                              <NotificationCard
                                key={
                                  item.id
                                }
                                item={
                                  item
                                }
                                onRead={
                                  markOneRead
                                }
                                onDelete={
                                  deleteOne
                                }
                              />
                            ),
                          )}
                        </motion.div>
                      </AccordionBody>
                    </div>
                  )}

                  {groupedNotifications
                    .indicatorGroups.EMA
                    .length > 0 && (
                    <div className="mb-5">
                      <AccordionHeader
                        icon="🟢"
                        title="EMA"
                        subtitle="Trend cross / higher timeframe structure"
                        count={
                          groupedNotifications
                            .indicatorGroups
                            .EMA
                            .length
                        }
                        open={
                          openIndicatorGroups
                            .EMA
                        }
                        onClick={() =>
                          toggleIndicatorGroup(
                            'EMA',
                          )
                        }
                      />

                      <AccordionBody
                        open={
                          openIndicatorGroups
                            .EMA
                        }
                      >
                        <motion.div
                          layout
                          transition={
                            LAYOUT_TRANSITION
                          }
                        >
                          {groupedNotifications.indicatorGroups.EMA.map(
                            item => (
                              <NotificationCard
                                key={
                                  item.id
                                }
                                item={
                                  item
                                }
                                onRead={
                                  markOneRead
                                }
                                onDelete={
                                  deleteOne
                                }
                              />
                            ),
                          )}
                        </motion.div>
                      </AccordionBody>
                    </div>
                  )}

                  {groupedNotifications
                    .indicatorGroups.OTHER
                    .length > 0 && (
                    <div className="mb-5">
                      <AccordionHeader
                        icon="⚪"
                        title="OTHER"
                        count={
                          groupedNotifications
                            .indicatorGroups
                            .OTHER
                            .length
                        }
                        open={
                          openIndicatorGroups
                            .OTHER
                        }
                        onClick={() =>
                          toggleIndicatorGroup(
                            'OTHER',
                          )
                        }
                      />

                      <AccordionBody
                        open={
                          openIndicatorGroups
                            .OTHER
                        }
                      >
                        <motion.div
                          layout
                          transition={
                            LAYOUT_TRANSITION
                          }
                        >
                          {groupedNotifications.indicatorGroups.OTHER.map(
                            item => (
                              <NotificationCard
                                key={
                                  item.id
                                }
                                item={
                                  item
                                }
                                onRead={
                                  markOneRead
                                }
                                onDelete={
                                  deleteOne
                                }
                              />
                            ),
                          )}
                        </motion.div>
                      </AccordionBody>
                    </div>
                  )}
                </motion.div>
              </AccordionBody>
            </section>
          )}

          {groupedNotifications.institutional
            .length > 0 && (
            <section className="mb-6">
              <AccordionHeader
                icon="🏦"
                title="INSTITUTIONAL FLOW"
                subtitle="Flow Layer / positioning pressure"
                count={
                  groupedNotifications
                    .institutional.length
                }
                open={
                  openSections.institutional
                }
                onClick={() =>
                  toggleSection(
                    'institutional',
                  )
                }
              />

              <AccordionBody
                open={
                  openSections.institutional
                }
              >
                <motion.div
                  layout
                  transition={
                    LAYOUT_TRANSITION
                  }
                >
                  {groupedNotifications.institutional.map(
                    item => (
                      <NotificationCard
                        key={item.id}
                        item={item}
                        onRead={
                          markOneRead
                        }
                        onDelete={
                          deleteOne
                        }
                      />
                    ),
                  )}
                </motion.div>
              </AccordionBody>
            </section>
          )}

          {visibleCount === 0 && (
            <motion.div
              layout
              initial={{
                opacity: 0,
                y: 14,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={
                CARD_TRANSITION
              }
              className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-sm text-gray-400 backdrop-blur-xl"
            >
              표시할 알림이 없습니다.
            </motion.div>
          )}
        </motion.div>
      </div>
    </main>
  )
}
