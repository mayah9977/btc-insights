'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion, type Transition } from 'framer-motion'
import type { NotificationViewItem } from '@/lib/notification/notificationStore'
import { useNotificationStore } from '@/lib/notification/notificationStore'

type Props = {
  initialNotifications: NotificationViewItem[]
  initialUnreadCount: number
  isVIP: boolean
}

type IndicatorGroupKey = 'RSI' | 'MACD' | 'EMA' | 'OTHER'

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

function getIndicatorLabel(data: any) {
  const SIGNAL_MAP: Record<string, Record<string, string>> = {
    RSI: {
      RSI_OVERBOUGHT: 'RSI 과매수 진입',
      RSI_OVERSOLD: 'RSI 과매도 진입',
    },
    MACD: {
      GOLDEN_CROSS: 'MACD 골든크로스',
      DEAD_CROSS: 'MACD 데드크로스',
    },
    EMA: {
      BULLISH_TREND: 'EMA 상승 전환',
      BEARISH_TREND: 'EMA 하락 추세',
    },
  }

  return (
    SIGNAL_MAP[data?.indicator]?.[data?.signal] ??
    `${data?.indicator} ${data?.signal}`
  )
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
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')

  return `${yyyy}.${mm}.${dd} ${hh}:${mi}`
}

function getIndicatorGroup(title: string): IndicatorGroupKey {
  if (title.includes('RSI')) return 'RSI'
  if (title.includes('MACD')) return 'MACD'
  if (title.includes('EMA')) return 'EMA'
  return 'OTHER'
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
          <div className="text-sm font-semibold text-white">{title}</div>
          {subtitle && <div className="text-xs text-gray-400">{subtitle}</div>}
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
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={ACCORDION_TRANSITION}
          className="overflow-hidden"
        >
          <motion.div layout transition={LAYOUT_TRANSITION}>
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
}: {
  item: NotificationViewItem
  onRead: (id: string) => void
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={CARD_TRANSITION}
      onClick={() => void onRead(item.id)}
      className={`group relative mb-3 cursor-pointer overflow-hidden rounded-2xl border p-4 backdrop-blur-xl transition ${
        item.read
          ? 'border-white/10 bg-white/[0.04]'
          : 'border-yellow-500/20 bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-yellow-500/[0.06]'
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="truncate text-sm font-semibold text-white">
              {item.title}
            </div>
            {!item.read && (
              <span className="h-2 w-2 shrink-0 rounded-full bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.8)]" />
            )}
          </div>

          <div className="mt-1 text-sm leading-relaxed text-gray-300">
            {item.body}
          </div>
        </div>

        <div className="shrink-0 text-right">
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
  const notifications = useNotificationStore(state => state.notifications)
  const unreadCount = useNotificationStore(state => state.unreadCount)
  const setServerSnapshot = useNotificationStore(state => state.setServerSnapshot)
  const pushIncoming = useNotificationStore(state => state.pushIncoming)
  const markOneRead = useNotificationStore(state => state.markOneRead)
  const markAllRead = useNotificationStore(state => state.markAllRead)

  const [openSections, setOpenSections] = useState({
    btcAlert: true,
    indicator: true,
  })

  const [openIndicatorGroups, setOpenIndicatorGroups] = useState<Record<IndicatorGroupKey, boolean>>({
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

    void markAllRead()
  }, [
    initialNotifications,
    initialUnreadCount,
    isVIP,
    setServerSnapshot,
    markAllRead,
  ])

  useEffect(() => {
    const handleAlert = (event: Event) => {
      const detail = (event as CustomEvent).detail

      pushIncoming({
        id: String(detail.alertId),
        type: 'BTC_ALERT',
        title: `${detail.symbol} price notification`,
        body: `Price ${detail.price} reached`,
        createdAt: detail.ts ?? Date.now(),
        read: false,
      })
    }

    const handleIndicator = (event: Event) => {
      const detail = (event as CustomEvent).detail
      const label = getIndicatorLabel(detail)

      pushIncoming({
        id: `${detail.symbol}-${detail.signal}-${detail.ts ?? Date.now()}`,
        type: 'INDICATOR',
        title: `${detail.indicator} signal`,
        body: label,
        createdAt: detail.ts ?? Date.now(),
        read: false,
      })
    }

    window.addEventListener('alert:triggered', handleAlert)
    window.addEventListener('indicator:triggered', handleIndicator)

    return () => {
      window.removeEventListener('alert:triggered', handleAlert)
      window.removeEventListener('indicator:triggered', handleIndicator)
    }
  }, [pushIncoming])

  const dedupedNotifications = useMemo(() => {
    const map = new Map<string, NotificationViewItem>()

    for (const item of notifications) {
      const key = item.id || `${item.type}-${item.title}-${item.body}`
      const existing = map.get(key)

      if (!existing || existing.createdAt < item.createdAt) {
        map.set(key, item)
      }
    }

    return Array.from(map.values()).sort((a, b) => b.createdAt - a.createdAt)
  }, [notifications])

  const groupedNotifications = useMemo(() => {
    const now = Date.now()
    const twelveHoursAgo = now - 12 * 60 * 60 * 1000

    const btcAlert: NotificationViewItem[] = []
    const indicator: NotificationViewItem[] = []

    for (const item of dedupedNotifications) {
      if (item.createdAt < twelveHoursAgo) continue

      if (item.type === 'BTC_ALERT') {
        btcAlert.push(item)
      } else if (item.type === 'INDICATOR') {
        indicator.push(item)
      }
    }

    const indicatorGroups: Record<IndicatorGroupKey, NotificationViewItem[]> = {
      RSI: [],
      MACD: [],
      EMA: [],
      OTHER: [],
    }

    for (const item of indicator) {
      indicatorGroups[getIndicatorGroup(item.title)].push(item)
    }

    return {
      btcAlert,
      indicator,
      indicatorGroups,
    }
  }, [dedupedNotifications])

  const toggleSection = (key: 'btcAlert' | 'indicator') => {
    setOpenSections(prev => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const toggleIndicatorGroup = (key: IndicatorGroupKey) => {
    setOpenIndicatorGroups(prev => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const visibleCount =
    groupedNotifications.btcAlert.length + groupedNotifications.indicator.length

  return (
    <main className="min-h-screen bg-black px-4 py-20 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Notification History</h1>
            <p className="mt-1 text-sm text-gray-400">
              BTC ALERT / INDICATOR 알림만 최근 12시간 기준으로 표시됩니다.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-gray-200">
              unread {unreadCount}
            </span>

            <button
              onClick={() => void markAllRead()}
              className="rounded-xl border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/15"
            >
              모두 읽음
            </button>
          </div>
        </div>

        <motion.div layout transition={LAYOUT_TRANSITION}>
          {groupedNotifications.btcAlert.length > 0 && (
            <section className="mb-6">
              <AccordionHeader
                icon="🔔"
                title="BTC ALERT"
                subtitle="BTC 가격 알림"
                count={groupedNotifications.btcAlert.length}
                open={openSections.btcAlert}
                onClick={() => toggleSection('btcAlert')}
              />

              <AccordionBody open={openSections.btcAlert}>
                <motion.div layout transition={LAYOUT_TRANSITION}>
                  {groupedNotifications.btcAlert.map(item => (
                    <NotificationCard
                      key={item.id}
                      item={item}
                      onRead={markOneRead}
                    />
                  ))}
                </motion.div>
              </AccordionBody>
            </section>
          )}

          {groupedNotifications.indicator.length > 0 && (
            <section className="mb-6">
              <AccordionHeader
                icon="📊"
                title="INDICATOR"
                subtitle="RSI / MACD / EMA 신호"
                count={groupedNotifications.indicator.length}
                open={openSections.indicator}
                onClick={() => toggleSection('indicator')}
              />

              <AccordionBody open={openSections.indicator}>
                <motion.div layout transition={LAYOUT_TRANSITION}>
                  {groupedNotifications.indicatorGroups.RSI.length > 0 && (
                    <div className="mb-5">
                      <AccordionHeader
                        icon="🟣"
                        title="RSI"
                        count={groupedNotifications.indicatorGroups.RSI.length}
                        open={openIndicatorGroups.RSI}
                        onClick={() => toggleIndicatorGroup('RSI')}
                      />
                      <AccordionBody open={openIndicatorGroups.RSI}>
                        <motion.div layout transition={LAYOUT_TRANSITION}>
                          {groupedNotifications.indicatorGroups.RSI.map(item => (
                            <NotificationCard
                              key={item.id}
                              item={item}
                              onRead={markOneRead}
                            />
                          ))}
                        </motion.div>
                      </AccordionBody>
                    </div>
                  )}

                  {groupedNotifications.indicatorGroups.MACD.length > 0 && (
                    <div className="mb-5">
                      <AccordionHeader
                        icon="🔵"
                        title="MACD"
                        count={groupedNotifications.indicatorGroups.MACD.length}
                        open={openIndicatorGroups.MACD}
                        onClick={() => toggleIndicatorGroup('MACD')}
                      />
                      <AccordionBody open={openIndicatorGroups.MACD}>
                        <motion.div layout transition={LAYOUT_TRANSITION}>
                          {groupedNotifications.indicatorGroups.MACD.map(item => (
                            <NotificationCard
                              key={item.id}
                              item={item}
                              onRead={markOneRead}
                            />
                          ))}
                        </motion.div>
                      </AccordionBody>
                    </div>
                  )}

                  {groupedNotifications.indicatorGroups.EMA.length > 0 && (
                    <div className="mb-5">
                      <AccordionHeader
                        icon="🟢"
                        title="EMA"
                        count={groupedNotifications.indicatorGroups.EMA.length}
                        open={openIndicatorGroups.EMA}
                        onClick={() => toggleIndicatorGroup('EMA')}
                      />
                      <AccordionBody open={openIndicatorGroups.EMA}>
                        <motion.div layout transition={LAYOUT_TRANSITION}>
                          {groupedNotifications.indicatorGroups.EMA.map(item => (
                            <NotificationCard
                              key={item.id}
                              item={item}
                              onRead={markOneRead}
                            />
                          ))}
                        </motion.div>
                      </AccordionBody>
                    </div>
                  )}

                  {groupedNotifications.indicatorGroups.OTHER.length > 0 && (
                    <div className="mb-5">
                      <AccordionHeader
                        icon="⚪"
                        title="OTHER"
                        count={groupedNotifications.indicatorGroups.OTHER.length}
                        open={openIndicatorGroups.OTHER}
                        onClick={() => toggleIndicatorGroup('OTHER')}
                      />
                      <AccordionBody open={openIndicatorGroups.OTHER}>
                        <motion.div layout transition={LAYOUT_TRANSITION}>
                          {groupedNotifications.indicatorGroups.OTHER.map(item => (
                            <NotificationCard
                              key={item.id}
                              item={item}
                              onRead={markOneRead}
                            />
                          ))}
                        </motion.div>
                      </AccordionBody>
                    </div>
                  )}
                </motion.div>
              </AccordionBody>
            </section>
          )}

          {visibleCount === 0 && (
            <motion.div
              layout
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={CARD_TRANSITION}
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
