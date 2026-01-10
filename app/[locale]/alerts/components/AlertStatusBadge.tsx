'use client'

import type { PriceAlert } from '@/lib/alerts/alertStore.types'
import {
  getAlertStatus,
  type AlertUIStatus,
} from '@/lib/alerts/alertStore.client'

/* =========================
 * Visual Map (UI 전용)
 * ========================= */
const STATUS_MAP: Record<
  AlertUIStatus,
  { label: string; className: string }
> = {
  WAITING: {
    label: '대기',
    className:
      'bg-slate-700/60 text-slate-200 border border-slate-500/30',
  },
  COOLDOWN: {
    label: '쿨타임',
    className:
      'bg-amber-400/20 text-amber-300 border border-amber-400/40',
  },
  TRIGGERED: {
    label: '완료',
    className:
      'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40',
  },
  DISABLED: {
    label: 'OFF',
    className:
      'bg-zinc-700/40 text-zinc-400 border border-zinc-600/30',
  },
}

export default function AlertStatusBadge({
  alert,
}: {
  alert: PriceAlert
}) {
  const status = getAlertStatus(alert)
  const meta = STATUS_MAP[status]

  return (
    <span
      className={`
        inline-flex items-center
        px-2 py-0.5
        rounded-full
        text-[11px] font-medium
        tracking-tight
        ${meta.className}
      `}
    >
      {meta.label}
    </span>
  )
}
