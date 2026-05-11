// lib/notification/registerPushToken.ts
import { getToken } from 'firebase/messaging'
import { getFirebaseMessaging } from '@/lib/firebase-config'

function isValidSenderId(value: unknown): value is string {
  if (!value) return false
  if (typeof value !== 'string') return false

  const v = value.trim()

  if (!v) return false
  if (v === 'undefined') return false
  if (v === 'null') return false
  if (!/^\d+$/.test(v)) return false

  return true
}

export async function registerPushToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null
  if (!('serviceWorker' in navigator)) return null

  try {
    const raw = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID

    console.log('[REGISTER TOKEN ENV]', raw)

    if (!isValidSenderId(raw)) {
      console.warn('[FCM BLOCK] invalid senderId → skip ALL')
      return null
    }

    const permission = await Notification.requestPermission()

    console.log('[FCM PERMISSION]', permission)

    if (permission !== 'granted') {
      console.warn('[FCM] permission denied')
      return null
    }

    const registration =
      (await navigator.serviceWorker.getRegistration(
        '/firebase-messaging-sw.js'
      )) ||
      (await navigator.serviceWorker.register(
        '/firebase-messaging-sw.js'
      ))

    console.log('[FCM SW READY]', registration.scope)

    const messaging = await getFirebaseMessaging()

    if (!messaging) {
      console.warn('[FCM] messaging unavailable')
      return null
    }

    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    })

    if (!token) {
      console.warn('[FCM] token not issued')
      return null
    }

    console.log('[FCM TOKEN SUCCESS]', token)

    await fetch('/api/notification/register-push-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'dev-user',
        token,
      }),
    })

    return token
  } catch (err) {
    console.error('[FCM REGISTER FATAL]', err)
    return null
  }
}
