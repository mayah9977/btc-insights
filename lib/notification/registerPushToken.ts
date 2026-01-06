import { getToken } from 'firebase/messaging'
import { messaging } from '@/lib/firebase-config'

export async function registerPushToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null
  if (!messaging) return null
  if (!('serviceWorker' in navigator)) return null

  // 1️⃣ Notification permission
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    console.warn('[FCM] Notification permission denied')
    return null
  }

  // 2️⃣ Service Worker (reuse if exists)
  const registration =
    (await navigator.serviceWorker.getRegistration(
      '/firebase-messaging-sw.js'
    )) ||
    (await navigator.serviceWorker.register(
      '/firebase-messaging-sw.js'
    ))

  // 3️⃣ Get FCM token
  const token = await getToken(messaging, {
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration,
  })

  if (!token) {
    console.warn('[FCM] Token not issued')
    return null
  }

  console.log('[FCM] TOKEN:', token)
  return token
}
