'use client'

import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { motion } from 'framer-motion'

import AlertStatsCard from '../AlertStatsCard'
import ActiveAlertsList from '../components/ActiveAlertsList'
import AlertsToast from '../components/AlertsToast'
import AlertCreateModal from '../components/AlertCreateModal'
import AlertEditModal from '../components/AlertEditModal'
import NotificationSoundSettings from '../components/NotificationSoundSettings'
import NotificationStopButton from '../components/NotificationStopButton'
import VIPUpgradeModal from '../components/VIPUpgradeModal' // ✅ added

import IndicatorCards from './IndicatorCards'
import IndicatorInfoCards from './IndicatorInfoCards'
import CriticalPriceOverlay from './CriticalPriceOverlay'
import VIPWhaleZoneOverlay from './VIPWhaleZoneOverlay'
import VIPWhaleHeatmap from './VIPWhaleHeatmap'
import CriticalChecklistOverlay from './CriticalChecklistOverlay'

import HeroMobile from '@/components/casino/hero/HeroMobile'

import { useCriticalLock } from './useCriticalLock'
import { useCriticalChecklist } from './useCriticalChecklist'
import { useAlertsStore } from '../providers/alertsStore.zustand'
import { useAlertsSSEStore } from '@/lib/alerts/alertsSSEStore'
import { useRealtimeMarket } from '@/lib/realtime/useRealtimeMarket'
import { getUserVIP } from '@/lib/auth/getUserVIP'
import type { PriceAlert } from '@/lib/alerts/alertStore.types'

export default function BTCAlertsView() {
  const bootstrapSSE = useAlertsSSEStore(s => s.bootstrap)

  useEffect(() => {
    bootstrapSSE()
  }, [bootstrapSSE])

  const market = useRealtimeMarket()
  const { locked, unlock } = useCriticalLock(market.price)
  const critical = useCriticalChecklist(market.price)

  const { bootstrap } = useAlertsStore()

  const [createOpen, setCreateOpen] = useState(false)
  const [editAlert, setEditAlert] = useState<PriceAlert | null>(null)
  const [isVIP, setIsVIP] = useState(false)
  const [vipModalOpen, setVipModalOpen] = useState(false) // ✅ added

  useEffect(() => {
    document.body.style.background = '#05070d'
    return () => {
      document.body.style.background = ''
    }
  }, [])

  useEffect(() => {
    ;(async () => {
      const vip = await getUserVIP()
      setIsVIP(vip)
    })()
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05070d] text-white">
      {critical.locked && (
        <CriticalChecklistOverlay
          checks={critical.checks}
          toggle={critical.toggle}
          unlock={critical.unlock}
        />
      )}

      {locked && !critical.locked && (
        <CriticalPriceOverlay price={market.price} onConfirm={unlock} />
      )}

      <VIPWhaleZoneOverlay price={market.price} />

      <div className="relative z-10 mx-auto mt-6 w-full max-w-[420px] px-4 sm:max-w-5xl">
        <VIPWhaleHeatmap price={market.price} />
      </div>

      <AlertsToast />

      <div className="relative z-10 flex justify-center pt-10">
        <AlertStatsCard />
      </div>

      <div className="relative z-10 mx-auto mt-10 w-full max-w-[420px] px-4 sm:max-w-5xl">
        <motion.h2
          onClick={() => {
            if (!isVIP) setVipModalOpen(true) // ✅ added
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="mb-4 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="text-base font-extrabold tracking-wider bg-gradient-to-r from-yellow-300 via-orange-400 to-pink-500 bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(255,200,0,0.7)]">
              BTC Indicator Alert
            </span>

            <span
              className={clsx(
                'rounded-full px-2 py-[2px] text-[10px] font-bold tracking-wide',
                isVIP
                  ? 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/40'
                  : 'bg-orange-400/20 text-orange-300 border border-orange-400/40 shadow-[0_0_8px_rgba(255,150,0,0.6)]',
              )}
            >
              {isVIP ? 'VIP' : 'VIP 전용'}
            </span>
          </div>

          <div
            className={clsx(
              'mt-2 text-xs font-semibold',
              isVIP
                ? 'text-white/80'
                : 'text-orange-300 drop-shadow-[0_0_6px_rgba(255,140,0,0.6)]',
            )}
          >
            {isVIP
              ? '15분봉 기준 RSI / MACD / EMA 신호 알림'
              : '🔒 VIP 전용 기능입니다 · 지금 업그레이드 후 이용 가능'}
          </div>

          <div className="mt-2 h-[1px] w-full bg-gradient-to-r from-transparent via-yellow-400/60 to-transparent opacity-80 animate-pulse" />
        </motion.h2>

        {isVIP && <IndicatorCards />}

        <div className="mt-6 rounded-3xl border border-white/10 bg-gradient-to-b from-[#0c1224] to-[#070b17] p-4">
          <ActiveAlertsList onEdit={setEditAlert} />
        </div>
      </div>

      <div className="relative z-10 mx-auto mt-10 w-full max-w-[420px] px-4 sm:max-w-5xl">
        <h2 className="mb-4 text-sm font-extrabold tracking-widest text-cyan-300">
          RSI + MACD + 이동평균선 설명 카드클릭
        </h2>

        <IndicatorInfoCards />
      </div>

      <div className="relative z-10 mx-auto mt-10 w-full max-w-[420px] px-4 sm:max-w-5xl">
        <NotificationSoundSettings />

        <div className="mt-4">
          <NotificationStopButton />
        </div>
      </div>

      <div className="relative z-10 mx-auto mt-10 w-full max-w-[420px] px-4 sm:max-w-5xl">
        <HeroMobile
          isLoggedIn={true}
          isVIP={false}
          title="기관급 고래들의 움직임 감지됨"
          description="실시간 고래들의 매수/매도 확인하러가기."
        />
      </div>

      {createOpen && (
        <AlertCreateModal
          onClose={() => setCreateOpen(false)}
          onSaved={() => {
            bootstrap()
            setCreateOpen(false)
          }}
        />
      )}

      {editAlert && (
        <AlertEditModal
          alert={editAlert}
          onClose={() => setEditAlert(null)}
          onSaved={() => {
            bootstrap()
            setEditAlert(null)
          }}
        />
      )}

      {/* ✅ added */}
      {vipModalOpen && (
        <VIPUpgradeModal onClose={() => setVipModalOpen(false)} />
      )}
    </div>
  )
}
