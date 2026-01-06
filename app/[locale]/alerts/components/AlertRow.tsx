'use client'

import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import clsx from 'clsx'
import type { PriceAlert } from '@/lib/alerts/alertStore.client'
import {
  getAlertStatus,
  type AlertStatus,
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
  const [enabled, setEnabled] = useState(alert.enabled)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setEnabled(alert.enabled)
  }, [alert.enabled])

  const status: AlertStatus = useMemo(() => {
    return getAlertStatus({ ...alert, enabled })
  }, [
    enabled,
    alert.condition,
    alert.targetPrice,
    alert.percent,
    alert.repeatMode,
    alert.triggered,
    alert.lastTriggeredAt,
    alert.cooldownMs,
  ])

  /* =========================
   * Toggle enabled
   * ========================= */
  const toggle = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation()
      if (loading) return

      const next = !enabled
      setEnabled(next)
      setLoading(true)

      try {
        const res = await fetch(`/api/alerts/${alert.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled: next }),
        })

        if (!res.ok) {
          throw new Error('Toggle failed')
        }
      } catch {
        // ❌ 실패 시 롤백
        setEnabled(!next)
      } finally {
        setLoading(false)
      }
    },
    [alert.id, enabled, loading],
  )

  /* =========================
   * 🔥 DELETE (핵심 수정)
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

        if (!res.ok) {
          throw new Error('Delete failed')
        }

        // ✅ 서버 삭제 성공 → client store 즉시 반영
        useAlertsStore.getState().removeAlert(alert.id)

        // (옵션) 부모 콜백
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
          status === 'WAITING' && 'border-vipBorder hover:border-white/30',
          status === 'COOLDOWN' && 'border-white/10 opacity-80',
          status === 'DISABLED' && 'border-white/5 opacity-40',
        )}
      >
        {/* Toggle */}
        <button
          onClick={toggle}
          className={clsx(
            'absolute top-4 left-4 w-10 h-5 rounded-full',
            enabled ? 'bg-emerald-500' : 'bg-zinc-600',
          )}
        >
          <span
            className={clsx(
              'absolute top-0.5 h-4 w-4 rounded-full bg-black transition-transform',
              enabled ? 'translate-x-5' : 'translate-x-1',
            )}
          />
        </button>

        {/* Status */}
        <div className="absolute top-4 right-4">
          <AlertStatusBadge alert={alert} />
        </div>

        <div className="mt-8 text-sm text-slate-300">{alert.symbol}</div>

        <div className="mt-2 text-3xl font-bold text-white">
          {alert.targetPrice
            ? alert.targetPrice.toLocaleString()
            : `${alert.percent}%`}
        </div>

        <div className="mt-1 text-xs text-slate-400">
          {alert.condition.replace('_', ' ')}
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
            {alert.repeatMode === 'ONCE' ? '1회 알림' : '반복 알림'}
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
