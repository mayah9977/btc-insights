'use client'

import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  animate,
} from 'framer-motion'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react'
import { stopNotificationLoop } from '@/lib/alerts/alertsSSEStore'

type Props = {
  t: any
  type: 'BTC' | 'INDICATOR'
  symbol: string
  price?: number
  label?: string
  indicator?: string
  signal?: string
  value?: number
}

export default function AlertToastCard({
  t,
  type,
  symbol,
  price,
  label,
  indicator,
  signal,
  value,
}: Props) {
  const router = useRouter()

  const isUp =
    signal?.toLowerCase().includes('golden') ||
    label?.includes('상승')

  const count = useMotionValue(0)
  const rounded = useTransform(count, latest =>
    Math.floor(latest).toLocaleString(),
  )

  useEffect(() => {
    if (price) {
      const controls = animate(count, price, {
        duration: 1.2,
        ease: 'easeOut',
      })
      return controls.stop
    }
  }, [count, price])

  /* =========================
     🔥 OK BUTTON HANDLER
  ========================= */
  const handleConfirm = (e: React.MouseEvent) => {
    e.stopPropagation()

    stopNotificationLoop()

    if (type === 'BTC') {
      router.push('/ko/alerts')
      return
    }

    router.push('/ko/alerts?tab=indicator')
  }

  return (
    <AnimatePresence>
      {t.visible && (
        <motion.div
          initial={{ x: 120, opacity: 0, scale: 0.95 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          exit={{ x: 120, opacity: 0, scale: 0.95 }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 20,
          }}
          className="relative w-full max-w-[360px] rounded-2xl p-[1px] bg-gradient-to-br from-indigo-500/40 via-purple-500/30 to-cyan-400/30 shadow-[0_0_35px_rgba(99,102,241,0.45)]"
        >
          <motion.div
            whileHover={{ scale: 1.03 }}
            className="relative rounded-2xl bg-[#0B0F19]/95 p-4 backdrop-blur-xl"
          >
            {/* =========================
               🔥 OK BUTTON (overlay)
               기존 layout 절대 안건드림
            ========================= */}
            <button
              onClick={handleConfirm}
              className="
                absolute
                top-3
                right-3
                z-20
                min-w-[52px]
                min-h-[32px]
                px-3
                rounded-full
                border
                border-emerald-400/20
                bg-emerald-500/10
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
                  ? 'BTC PRICE ALERT'
                  : 'INDICATOR SIGNAL'}
              </div>

              {type === 'BTC' && (
                <div
                  className={`flex items-center ${
                    isUp ? 'text-green-400' : 'text-red-400'
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

            <div className="text-lg font-semibold text-white">
              {symbol}
            </div>

            {type === 'BTC' ? (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mt-1 text-xs text-gray-400"
                >
                  설정한 목표 가격 도달
                </motion.div>

                <div className="mt-1 text-3xl font-bold tracking-tight text-white">
                  $
                  <motion.span>{rounded}</motion.span>
                </div>

                <div className="mt-1 text-xs text-gray-500">
                  목표가에 도달했습니다
                </div>
              </>
            ) : (
              <>
                <div className="mt-1 text-sm text-white">
                  {indicator}
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-1 text-lg font-bold text-indigo-300"
                >
                  {label}
                </motion.div>

                <div className="mt-1 text-xs text-gray-400">
                  {indicator === 'RSI' &&
                    '과매수/과매도 상태를 나타냅니다'}
                  {indicator === 'MACD' &&
                    '추세 전환 신호입니다'}
                  {indicator === 'EMA' &&
                    '추세 방향 변화 신호입니다'}
                </div>

                {value !== undefined && (
                  <div className="mt-1 text-xs text-gray-500">
                    value: {value.toFixed(2)}
                  </div>
                )}
              </>
            )}

            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-30 animate-pulse" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
