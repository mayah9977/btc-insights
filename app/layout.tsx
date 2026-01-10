'use client'

import './styles/globals.css'
import { useEffect, useRef } from 'react'
import { Toaster } from 'react-hot-toast' // ✅ 추가
import { useAlertsSSEStore } from '@/lib/alerts/alertsSSEStore'
import { registerPushToken } from '@/lib/notification/registerPushToken'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  /**
   * 🔑 ALERTS SSE bootstrap
   * --------------------------------------------------
   * - 앱 전체 생명주기에서 단 1회만 실행
   * - 페이지 이동 / locale 변경 / StrictMode 안전
   * - SSE 단일 연결 보장
   */
  const bootstrapAlertsSSE = useAlertsSSEStore(s => s.bootstrap)

  /**
   * 🔔 Push token register (1회 보장)
   */
  const pushInitRef = useRef(false)

  useEffect(() => {
    // SSE bootstrap
    bootstrapAlertsSSE()

    // Push token register (only once)
    if (!pushInitRef.current) {
      pushInitRef.current = true
      registerPushToken().catch(err => {
        console.warn('[FCM] register failed', err)
      })
    }
  }, [bootstrapAlertsSSE])

  return (
    <html lang="ko">
      <body className="bg-neutral-950 text-white antialiased">
        {/* ✅ Toast 렌더러 (이게 없으면 절대 안 뜸) */}
        <Toaster position="bottom-right" />

        {children}
      </body>
    </html>
  )
}
