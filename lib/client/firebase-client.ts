'use client'

import { initializeApp, getApps } from 'firebase/app'
import { getMessaging, isSupported, Messaging } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
}

/** Firebase App (Singleton) */
export const firebaseApp =
  getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApps()[0]

/**
 * 🔔 Browser-only Firebase Messaging
 * - SSR 차단
 * - 지원 여부 체크
 */
export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (typeof window === 'undefined') return null

  const supported = await isSupported().catch(() => false)
  if (!supported) return null

  return getMessaging(firebaseApp)
}
