import { getToken } from 'firebase/messaging'
import { getFirebaseMessaging } from '@/lib/client/firebase-client'

const DEV_USER_ID = 'dev-user'

export async function registerPushToken() {
  if (typeof window === 'undefined') return null

  // ✅ 1️⃣ Service Worker 등록 (🔥 핵심)
  const registration = await navigator.serviceWorker.register(
    '/firebase-messaging-sw.js'
  )

  console.log('[SW REGISTERED]', registration.scope)

  // ✅ 2️⃣ 권한 요청
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return null

  // ✅ 3️⃣ Firebase Messaging
  const messaging = await getFirebaseMessaging()
  if (!messaging) {
    console.warn('[FCM] Messaging not supported')
    return null
  }

  // ✅ 4️⃣ FCM Token 발급 (SW 명시)
  const token = await getToken(messaging, {
    vapidKey: process.env.NEXT_PUBLIC_FCM_VAPID_KEY,
    serviceWorkerRegistration: registration,
  })

  if (!token) return null

  // ✅ 5️⃣ 서버 등록
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
}
