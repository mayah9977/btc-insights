// lib/firebase/client.ts

'use client'

import {
  initializeApp,
  getApps,
  getApp,
  type FirebaseApp,
  type FirebaseOptions,
} from 'firebase/app'
import { getAuth } from 'firebase/auth'

/* =========================================================
   Firebase Client SDK (브라우저 전용)
========================================================= */

const FIREBASE_APP_NAME = '[DEFAULT]'

function isValidString(value: unknown): value is string {
  if (!value) return false
  if (typeof value !== 'string') return false

  const v = value.trim()

  if (!v) return false
  if (v === 'undefined') return false
  if (v === 'null') return false

  return true
}

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

function getSafeSenderId(): string | undefined {
  const raw =
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID

  return isValidSenderId(raw) ? raw.trim() : undefined
}

/* =========================
   Config 통일
========================= */
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: getSafeSenderId(),
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
}

console.log('[FIREBASE CLIENT CONFIG]', {
  apiKeyExists: isValidString(firebaseConfig.apiKey),
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId,
})

function getClientFirebaseApp(): FirebaseApp {
  const apps = getApps()

  const existingDefaultApp = apps.find(
    (firebaseApp) =>
      firebaseApp.name === FIREBASE_APP_NAME,
  )

  if (existingDefaultApp) {
    console.log('[FIREBASE CLIENT] using existing app', {
      name: existingDefaultApp.name,
      projectId: existingDefaultApp.options.projectId,
      storageBucket:
        existingDefaultApp.options.storageBucket,
      messagingSenderId:
        existingDefaultApp.options.messagingSenderId,
      appId: existingDefaultApp.options.appId,
    })

    return getApp()
  }

  const firebaseApp = initializeApp(firebaseConfig)

  console.log('[FIREBASE CLIENT] initialized app', {
    name: firebaseApp.name,
    projectId: firebaseApp.options.projectId,
    storageBucket: firebaseApp.options.storageBucket,
    messagingSenderId:
      firebaseApp.options.messagingSenderId,
    appId: firebaseApp.options.appId,
  })

  return firebaseApp
}

/* =========================
   App 초기화
========================= */
const app = getClientFirebaseApp()

/* =========================
   Auth 유지
========================= */
export const auth = getAuth(app)

/* =========================
   export default 유지
========================= */
export default app
