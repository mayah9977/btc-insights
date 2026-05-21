//app/[locale]/alerts/components/ActiveAlertsList.tsx

'use client'

import { memo, useMemo } from 'react'
import AlertRow from './AlertRow'
import { useAlertsStore } from '../providers/alertsStore.zustand'
import type { PriceAlert } from '@/lib/alerts/alertStore.types'

type Props = {
  onEdit: (alert: PriceAlert) => void
}

function ActiveAlertsList({ onEdit }: Props) {
  // ✅ store state selector
  const alertsById = useAlertsStore(s => s.alertsById)
  const orderedIds = useAlertsStore(s => s.orderedIds)

  // ✅ derived list
  const alerts = useMemo(
    () => orderedIds.map(id => alertsById[id]).filter(Boolean),
    [orderedIds, alertsById],
  )

  if (!alerts.length) {
    return (
      <div className="py-10 text-center text-sm text-slate-500">
        활성 알림이 없습니다.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {alerts.map(alert => (
        <AlertRow
          key={alert.id}
          alert={alert}
          onEdit={() => onEdit(alert)}
          onDeleted={() => {
            /* 
              🔥 삭제 성공 후 UI는 AlertRow에서 이미 store 반영됨
              List는 re-render만 담당
            */
          }}
        />
      ))}
    </div>
  )
}

export default memo(ActiveAlertsList)
