'use client'

import clsx from 'clsx'
import { useAlertsStore } from './providers/alertsStore.zustand'
import { useAlertsSSEStore } from '@/lib/alerts/alertsSSEStore'
import { getAlertStatus } from '@/lib/alerts/alertStore.client'
import AlertStatRow from './AlertStatRow'
import SystemRiskBadge from './SystemRiskBadge'

export default function AlertStatsCard() {
  const connected = useAlertsSSEStore(s => s.connected)

  // ✅ primitive만 selector로 가져오기
  const all = useAlertsStore(s => s.getAll().length)

  const waiting = useAlertsStore(
    s =>
      s.getAll().filter(
        a => getAlertStatus(a) === 'WAITING',
      ).length,
  )

  const cooldown = useAlertsStore(
    s =>
      s.getAll().filter(
        a => getAlertStatus(a) === 'COOLDOWN',
      ).length,
  )

  const disabled = useAlertsStore(
    s =>
      s.getAll().filter(
        a => getAlertStatus(a) === 'DISABLED',
      ).length,
  )

  /* =========================
   * System Risk 계산
   * ========================= */
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
        'relative w-full max-w-[420px] rounded-3xl p-6',
        systemRiskLevel === 'SAFE'
          ? 'border-4 border-emerald-500'
          : systemRiskLevel === 'WARNING'
          ? 'border-4 border-amber-500'
          : 'border-4 border-red-600',
      )}
    >
      <SystemRiskBadge level={systemRiskLevel} />

      <div className="mt-4 grid gap-2">
        <AlertStatRow label="전체 알림" value={all} />
        <AlertStatRow label="대기중" value={waiting} />
        <AlertStatRow label="쿨다운" value={cooldown} />
        <AlertStatRow label="비활성" value={disabled} />
      </div>
    </div>
  )
}
