// lib/push/registerPushToken.ts
import { getToken } from 'firebase/messaging'
import { getFirebaseMessaging } from '@/lib/firebase-config'

const DEV_USER_ID = 'dev-user'

export async function registerPushToken() {
  if (typeof window === 'undefined') return null

  try {
    // ✅ messagingSenderId 없으면 skip
    if (!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID) {
      console.warn('[FCM] messagingSenderId 없음 → skip')
      return null
    }

    // ✅ Service Worker
    const registration = await navigator.serviceWorker.register(
      '/firebase-messaging-sw.js'
    )

    console.log('[SW REGISTERED]', registration.scope)

    // ✅ Permission
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return null

    // ✅ Lazy Messaging
    const messaging = await getFirebaseMessaging()
    if (!messaging) {
      console.warn('[FCM] Messaging not available')
      return null
    }

    // ✅ Token
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FCM_VAPID_KEY,
      serviceWorkerRegistration: registration,
    })

    if (!token) return null

    await fetch('/api/push/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: DEV_USER_ID,
        token,
      }),
    })

    console.log('[FCM TOKEN REGISTERED]', token)

    return token
  } catch (e) {
    console.error('[FCM ERROR]', e)
    return null
  }
}
