// app/[locale]/casino/vip/payment/success/page.tsx

'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { getAuth, signInWithCustomToken } from 'firebase/auth'
import { motion } from 'framer-motion'
import '@/lib/firebase/client'

export default function VIPPaymentSuccessPage() {
  const router = useRouter()
  const params = useParams<{ locale: string }>()
  const searchParams = useSearchParams()
  const ranRef = useRef(false)

  const locale = params?.locale || 'ko'
  const paymentKey = searchParams.get('paymentKey') || ''
  const orderId = searchParams.get('orderId') || ''
  const amount = searchParams.get('amount') || ''

  const [status, setStatus] = useState('VIP 결제를 확인하고 있습니다.')
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (ranRef.current) return

    ranRef.current = true

    async function completeVIPSignup() {
      try {
        console.log('[VIP_SUCCESS] start', {
          paymentKeyExists: !!paymentKey,
          orderId,
          amount,
        })

        if (!paymentKey || !orderId || !amount) {
          throw new Error('결제 승인 정보가 올바르지 않습니다.')
        }

        if (!orderId.startsWith('vip_signup_')) {
          throw new Error('VIP Signup 결제 주문이 아닙니다.')
        }

        const parsedAmount = Number(amount)

        if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
          throw new Error('결제 금액 정보가 올바르지 않습니다.')
        }

        setStatus('Toss 결제 승인을 처리하고 있습니다.')

        const confirmRes = await fetch('/api/vip/toss/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount: parsedAmount,
          }),
        })

        const confirmData = await confirmRes.json()

        console.log('[VIP_SUCCESS] confirm result', {
          ok: confirmRes.ok,
          status: confirmRes.status,
          data: confirmData,
        })

        if (!confirmRes.ok) {
          throw new Error(confirmData?.message || '결제 승인 실패')
        }

        setStatus('Firebase 계정을 생성하고 VIP 권한을 활성화하고 있습니다.')

        const activateRes = await fetch('/api/vip/activate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            orderId,
            paymentKey,
          }),
        })

        const activateData = await activateRes.json()

        console.log('[VIP_SUCCESS] activate result', {
          ok: activateRes.ok,
          status: activateRes.status,
          hasCustomToken: !!activateData?.customToken,
        })

        if (!activateRes.ok) {
          throw new Error(activateData?.message || 'VIP 활성화 실패')
        }

        if (!activateData?.customToken) {
          throw new Error('자동 로그인 토큰을 받을 수 없습니다.')
        }

        setStatus('Firebase 자동 로그인을 처리하고 있습니다.')

        const auth = getAuth()

        const userCredential = await signInWithCustomToken(
          auth,
          activateData.customToken,
        )

        const idToken = await userCredential.user.getIdToken(true)

        setStatus('서버 로그인 쿠키를 생성하고 있습니다.')

        const loginRes = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            idToken,
          }),
        })

        const loginData = await loginRes.json()

        console.log('[VIP_SUCCESS] login result', {
          ok: loginRes.ok,
          status: loginRes.status,
          data: loginData,
          cookie: document.cookie,
        })

        if (!loginRes.ok) {
          throw new Error(
            loginData?.error ||
              loginData?.message ||
              '서버 로그인 쿠키 생성 실패',
          )
        }

        sessionStorage.removeItem('vip_selected_plan')
        sessionStorage.removeItem('vip_pending_signup')

        setStatus('VIP 활성화가 완료되었습니다.')

        router.replace(`/${locale}/casino/vip`)
        router.refresh()
      } catch (e: unknown) {
        console.error('[VIP_SUCCESS] failed', e)

        const error = e as { message?: string }

        setErr(error?.message || 'VIP 계정 생성 중 오류가 발생했습니다.')
      }
    }

    completeVIPSignup()
  }, [amount, locale, orderId, paymentKey, router])

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.24),transparent_35%),linear-gradient(135deg,#020617,#020617_50%,#052e2b)] text-white">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.06] p-8 text-center shadow-[0_0_60px_rgba(16,185,129,0.22)] backdrop-blur-2xl"
      >
        {!err ? (
          <>
            <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-2 border-emerald-300/20 border-t-emerald-300" />

            <h1 className="text-2xl font-extrabold">
              VIP 활성화 중
            </h1>

            <p className="mt-3 text-sm text-slate-300">
              {status}
            </p>

            <p className="mt-4 text-xs text-slate-500">
              창을 닫지 말고 잠시만 기다려주세요.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-extrabold text-red-300">
              VIP 활성화 실패
            </h1>

            <p className="mt-3 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">
              {err}
            </p>

            <button
              onClick={() => router.replace(`/${locale}/vip/upgrade`)}
              className="mt-6 w-full rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/15"
            >
              다시 시도하기
            </button>
          </>
        )}
      </motion.div>
    </main>
  )
}
