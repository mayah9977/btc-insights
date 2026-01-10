'use client'

import { memo, useCallback, useState, useMemo } from 'react'
import clsx from 'clsx'
import type { PriceAlert } from '@/lib/alerts/alertTypes'
import {
  getAlertStatus,
  type AlertUIStatus,
} from '@/lib/alerts/alertStore.client'
import { useAlertsStore } from '../providers/alertsStore.zustand'
import PerformanceMiniChart from './PerformanceMiniChart'
import AlertStatusBadge from './AlertStatusBadge'
import AlertDetailModal from './AlertDetailModal'

type Props = {
  alert: PriceAlert
  onEdit: () => void
  onDeleted: () => void
}

function AlertRow({ alert, onEdit, onDeleted }: Props) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  /** ✅ 단일 기준: UI 상태 */
  const status: AlertUIStatus = useMemo(
    () => getAlertStatus(alert),
    [alert],
  )

  const isTriggered = status === 'TRIGGERED'
  const isDisabled = status === 'DISABLED'

  /* =========================
   * Toggle (status 기반)
   * - TRIGGERED는 잠금
   * ========================= */
  const toggle = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation()
      if (loading || isTriggered) return

      const nextStatus =
        status === 'DISABLED' ? 'WAITING' : 'DISABLED'

      setLoading(true)

      try {
        const res = await fetch(`/api/alerts/${alert.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: nextStatus }),
        })
        if (!res.ok) throw new Error('Toggle failed')

        /** ✅ zustand는 upsert만 */
        useAlertsStore.getState().upsertAlert({
          ...alert,
          status: nextStatus,
        })
      } finally {
        setLoading(false)
      }
    },
    [alert, loading, status, isTriggered],
  )

  /* =========================
   * DELETE
   * ========================= */
  const remove = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation()
      if (loading) return

      setLoading(true)
      try {
        const res = await fetch(`/api/alerts/${alert.id}`, {
          method: 'DELETE',
        })
        if (!res.ok) throw new Error('Delete failed')

        useAlertsStore.getState().removeAlert(alert.id)
        onDeleted()
      } finally {
        setLoading(false)
      }
    },
    [alert.id, loading, onDeleted],
  )

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className={clsx(
          'relative w-full max-w-[420px] cursor-pointer',
          'rounded-2xl border p-6 transition-all',
          'bg-gradient-to-b from-[#12182a] to-[#0b0f1a]',

          status === 'WAITING' &&
            'border-vipBorder hover:border-white/30',
          status === 'TRIGGERED' &&
            'border-emerald-500/40 opacity-90',
          status === 'DISABLED' &&
            'border-white/5 opacity-40',
        )}
      >
        {/* Toggle */}
        <button
          onClick={toggle}
          disabled={isTriggered}
          className={clsx(
            'absolute top-4 left-4 w-10 h-5 rounded-full',
            status !== 'DISABLED'
              ? 'bg-emerald-500'
              : 'bg-zinc-600',
            isTriggered && 'opacity-60 cursor-not-allowed',
          )}
        >
          <span
            className={clsx(
              'absolute top-0.5 h-4 w-4 rounded-full bg-black transition-transform',
              status !== 'DISABLED'
                ? 'translate-x-5'
                : 'translate-x-1',
            )}
          />
        </button>

        {/* Status Badge */}
        <div className="absolute top-4 right-4">
          <AlertStatusBadge alert={alert} />
        </div>

        <div className="mt-8 text-sm text-slate-300">
          {alert.symbol}
        </div>

        <div className="mt-2 text-3xl font-bold text-white">
          {alert.targetPrice
            ? alert.targetPrice.toLocaleString()
            : `${alert.percent}%`}
        </div>

        <div className="mt-1 text-xs text-slate-400">
          {alert.condition.replaceAll('_', ' ')}
        </div>

        <div className="mt-4">
          <PerformanceMiniChart
            data={[
              { value: -0.4 },
              { value: 0.2 },
              { value: 0.9 },
              { value: 0.6 },
              { value: 1.4 },
            ]}
          />
        </div>

        <div className="mt-6 flex justify-between text-xs text-slate-500">
          <span>
            {alert.repeatMode === 'ONCE'
              ? '1회 알림'
              : '반복 알림'}
          </span>

          <div className="flex gap-4">
            <button
              onClick={e => {
                e.stopPropagation()
                onEdit()
              }}
              className="text-vipAccent hover:underline"
            >
              수정
            </button>

            <button
              onClick={remove}
              className="text-rose-400 hover:underline"
            >
              삭제
            </button>
          </div>
        </div>
      </div>

      {open && (
        <AlertDetailModal
          alert={alert}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}

export default memo(AlertRow)
