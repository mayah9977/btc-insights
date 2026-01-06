'use client'

import type {
  PriceAlert,
  AlertStatus,
} from '@/lib/alerts/alertStore.client'

/* =========================
 * Client-side status calc
 * ========================= */
function getClientAlertStatus(alert: PriceAlert): AlertStatus {
  if (!alert.enabled) return 'DISABLED'

  if (alert.repeatMode === 'ONCE' && alert.triggered) {
    return 'ALREADY_TRIGGERED'
  }

  if (alert.lastTriggeredAt) {
    return 'COOLDOWN'
  }

  return 'WAITING'
}

/* =========================
 * Visual Map (Luxury leveled)
 * ========================= */
const STATUS_MAP: Record<
  AlertStatus,
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
  ALREADY_TRIGGERED: {
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
  const status = getClientAlertStatus(alert)
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
