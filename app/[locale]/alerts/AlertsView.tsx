'use client'

import { useMemo } from 'react'
import { useAlertsStore } from './providers/alertsStore.zustand'
import { useAlertsSSEStore } from '@/lib/alerts/alertsSSEStore'
import { getAlertStatus } from '@/lib/alerts/alertStore.client'
import AlertStatRow from './AlertStatRow'

export default function AlertsView() {
  const connected = useAlertsSSEStore(s => s.connected)

  // ✅ 단일 진입: 모든 알림
  const alerts = useAlertsStore(s => s.getAll())

  // ✅ UI 파생 상태 계산 (store selector 사용 ❌)
  const all = alerts.length

  const waiting = alerts.filter(
    a => getAlertStatus(a) === 'WAITING',
  ).length

  const cooldown = alerts.filter(
    a => getAlertStatus(a) === 'COOLDOWN',
  ).length

  const disabled = alerts.filter(
    a => getAlertStatus(a) === 'DISABLED',
  ).length

  const rows = useMemo(
    () => [
      {
        key: 'connected',
        label: '연결 상태',
        value: connected ? 'CONNECTED' : 'DISCONNECTED',
        highlight: true,
      },
      { key: 'all', label: '전체 알림', value: all },
      {
        key: 'waiting',
        label: '대기중',
        value: waiting,
        warningThreshold: 1,
        dangerThreshold: 3,
      },
      {
        key: 'cooldown',
        label: '쿨다운',
        value: cooldown,
        warningThreshold: 1,
        dangerThreshold: 3,
      },
      {
        key: 'disabled',
        label: '비활성',
        value: disabled,
        dangerThreshold: 1,
      },
    ],
    [connected, all, waiting, cooldown, disabled],
  )

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-6">
      <div className="w-[92%] max-w-[440px] rounded-3xl bg-[#FACC15] p-6">
        <div className="mt-5 grid gap-3">
          {rows.map(({ key, ...rest }) => (
            <AlertStatRow key={key} {...rest} />
          ))}
        </div>
      </div>
    </div>
  )
}
