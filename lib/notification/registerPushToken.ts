import { getToken } from 'firebase/messaging'
import { messaging } from '@/lib/firebase-config'

export async function registerPushToken() {
  if (!messaging) return null

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    console.warn('Notification permission denied')
    return null
  }

  const token = await getToken(messaging, {
    vapidKey:
      process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration:
      await navigator.serviceWorker.register(
        '/firebase-messaging-sw.js'
      ),
  })

  console.log('FCM TOKEN:', token)
  return token
}
