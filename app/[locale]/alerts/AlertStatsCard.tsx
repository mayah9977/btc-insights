'use client'

import clsx from 'clsx'
import { useAlertsStore } from './providers/alertsStore.zustand'
import { useAlertsSSEStore } from '@/lib/alerts/alertsSSEStore'
import AlertStatRow from './AlertStatRow'
import AlertStatusBadge from './AlertStatusBadge'
import SystemRiskBadge from './SystemRiskBadge'

export default function AlertStatsCard() {
  const connected = useAlertsSSEStore(s => s.connected)

  const all = useAlertsStore(s => s.getAll().length)
  const waiting = useAlertsStore(s => s.getWaiting().length)
  const cooldown = useAlertsStore(s => s.getCooldown().length)
  const disabled = useAlertsStore(s => s.getDisabled().length)

  const systemRiskScore =
    (!connected ? 2 : 0) +
    (waiting >= 3 ? 2 : waiting > 0 ? 1 : 0) +
    (cooldown >= 3 ? 2 : cooldown > 0 ? 1 : 0) +
    (disabled > 0 ? 2 : 0)

  const systemRiskLevel =
    systemRiskScore >= 4
      ? 'CRITICAL'
      : systemRiskScore >= 2
      ? 'WARNING'
      : 'SAFE'

  return (
    <div
      className={clsx(
        'relative w-full max-w-[420px] rounded-3xl bg-yellow-400 p-6',
        systemRiskLevel === 'SAFE'
          ? 'border-4 border-emerald-500'
          : systemRiskLevel === 'WARNING'
          ? 'border-4 border-amber-500'
          : 'border-4 border-red-600',
      )}
    >
      <SystemRiskBadge level={systemRiskLevel} />
      <AlertStatusBadge status={connected ? 'SAFE' : 'RISK'} />

      <div className="mt-4 grid gap-2">
        <AlertStatRow label="전체 알림" value={all} />
        <AlertStatRow label="대기중" value={waiting} />
        <AlertStatRow label="쿨다운" value={cooldown} />
        <AlertStatRow label="비활성" value={disabled} />
      </div>
    </div>
  )
}
