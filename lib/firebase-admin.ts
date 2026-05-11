import { getApps, initializeApp, cert, App } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'
import { getAuth } from 'firebase-admin/auth' // ✅ 추가

/* =========================================================
   Firebase Admin 초기화 (Local / Vercel 공용)
========================================================= */

/* =========================
   1) Credential 생성
========================= */
function createCredential() {
  // ▶ Production (Vercel: JSON 문자열)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      return cert(
        JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
      )
    } catch {
      throw new Error('❌ FIREBASE_SERVICE_ACCOUNT_KEY JSON 파싱 실패')
    }
  }

  // ▶ Local Development (.env 개별 변수)
  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey =
    process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('❌ Firebase Admin ENV 누락 (Local)')
  }

  return cert({
    projectId,
    clientEmail,
    privateKey,
  })
}

/* =========================
   2) Firebase Admin App
========================= */
const adminApp: App =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: createCredential(),
      })

/* =========================
   3) Services Export
========================= */

// 🔥 Firestore
export const adminDB = getFirestore(adminApp)

// 🔥 Messaging
export const adminMessaging = getMessaging(adminApp)

// 🔥 Auth (👉 이번에 추가된 핵심)
export const adminAuth = getAuth(adminApp)

// 🔒 하위 호환 (기존 코드 보호)
export const adminMsg = adminMessaging

// 🔧 Firestore util
export { FieldValue }
