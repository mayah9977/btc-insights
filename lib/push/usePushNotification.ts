import { useEffect } from 'react'

export function usePushNotification(onAlertTriggered: () => void) {
  useEffect(() => {
    if (!navigator.serviceWorker) return

    navigator.serviceWorker.addEventListener('message', event => {
      if (event.data?.type === 'ALERT_TRIGGERED') {
        onAlertTriggered()
      }
    })
  }, [onAlertTriggered])
}
