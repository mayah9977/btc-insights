'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useNotificationStore } from '@/lib/notification/notificationStore'

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

export default function HeaderNotificationBell() {
  const router = useRouter()
  const unreadCount = useNotificationStore(state => state.unreadCount)
  const loadUnreadCount = useNotificationStore(state => state.loadUnreadCount)
  const pushIncoming = useNotificationStore(state => state.pushIncoming)

  useEffect(() => {
    void loadUnreadCount()

    const handleFocus = () => {
      void loadUnreadCount()
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void loadUnreadCount()
      }
    }

    const handleAlertTriggered = (event: Event) => {
      const customEvent = event as CustomEvent
      const detail = customEvent.detail

      pushIncoming({
        id: String(detail.alertId),
        type: 'BTC_ALERT',
        title: `${detail.symbol} price notification`,
        body: `Price ${detail.price} reached`,
        createdAt: detail.ts ?? Date.now(),
        read: false,
      })
    }

    const handleIndicatorTriggered = (event: Event) => {
      const customEvent = event as CustomEvent
      const detail = customEvent.detail
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

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('alert:triggered', handleAlertTriggered)
    window.addEventListener('indicator:triggered', handleIndicatorTriggered)

    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('alert:triggered', handleAlertTriggered)
      window.removeEventListener('indicator:triggered', handleIndicatorTriggered)
    }
  }, [loadUnreadCount, pushIncoming])

  return (
    <button
      onClick={() => router.push('/ko/notifications')}
      className="relative text-sm opacity-80"
    >
      🔔

      {unreadCount > 0 && (
        <span className="absolute -right-2 -top-2 min-w-[18px] rounded-full bg-red-500 px-1.5 text-center text-[10px] font-bold leading-[18px] text-white">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  )
}
