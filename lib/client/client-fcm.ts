// lib/client/client-fcm.ts
'use client'

import { getToken } from 'firebase/messaging'
import { getFirebaseMessaging } from './firebase-client'

/**
 * 🔔 FCM Topic Subscribe (Client)
 * - 브라우저 권한 확인
 * - Service Worker 명시
 * - Firebase Messaging 지원 여부 체크
 */
export async function subscribeTopic(topic: string) {
  if (typeof window === 'undefined') return null

  // 1️⃣ Notification 권한 요청
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    console.warn('[FCM] permission denied')
    return null
  }

  // 2️⃣ Service Worker 등록 (필수)
  const registration = await navigator.serviceWorker.register(
    '/firebase-messaging-sw.js'
  )

  // 3️⃣ Firebase Messaging (browser-only)
  const messaging = await getFirebaseMessaging()
  if (!messaging) {
    console.warn('[FCM] messaging not supported')
    return null
  }

  // 4️⃣ FCM Token 발급
  const token = await getToken(messaging, {
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY!,
    serviceWorkerRegistration: registration,
  })

  if (!token) {
    console.warn('[FCM] token not issued')
    return null
  }

  // 5️⃣ 서버에 Topic 등록 요청
  await fetch('/api/fcm/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, topic }),
  })

  return token
}
