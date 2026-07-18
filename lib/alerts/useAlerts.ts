//lib/alerts/useAlerts/ts

import { useCallback, useEffect, useState } from 'react'
import { usePushNotification } from '../push/usePushNotification'

export function useAlerts() {
  const [alerts, setAlerts] = useState([])

  const fetchAlerts = useCallback(async () => {
    const res = await fetch('/api/alerts')
    const data = await res.json()
    setAlerts(data.alerts ?? [])
  }, [])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  /* 🔥 푸시 수신 시 재요청 */
  usePushNotification(() => {
    fetchAlerts()
  })

  return { alerts, refetch: fetchAlerts }
}
