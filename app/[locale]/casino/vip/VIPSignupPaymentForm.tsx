'use client'

import { useState } from 'react'
import { loadTossPayments } from '@tosspayments/tosspayments-sdk'
import { motion } from 'framer-motion'

type Props = {
  locale: string
}

type TossPaymentParams = {
  amount: number
  orderId: string
  orderName: string
  customerName: string
  customerEmail: string
  successUrl: string
  failUrl: string
}

type TossPaymentsWithRequestPayment = {
  requestPayment: (
    method: '카드' | 'CARD',
    params: TossPaymentParams
  ) => Promise<void>
}

export default function VIPSignupPaymentForm({ locale }: Props) {
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function handleVIPPayment(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)

    if (!email || !pw) {
      setErr('이메일과 비밀번호를 입력해주세요.')
      return
    }

    if (pw.length < 6) {
      setErr('비밀번호는 최소 6자 이상이어야 합니다.')
      return
    }

    try {
      setLoading(true)

      const normalizedEmail = email.trim().toLowerCase()

      // ✅ FIX 1: pw 포함해서 서버로 전달
      const orderRes = await fetch('/api/vip/toss/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: normalizedEmail,
          pw, // ✅ 추가
          locale,
        }),
      })

      const orderData = await orderRes.json()

      if (!orderRes.ok) {
        throw new Error(orderData?.message || '결제 주문 생성 실패')
      }

      if (!orderData?.orderId || !orderData?.amount) {
        throw new Error('결제 주문 응답이 올바르지 않습니다.')
      }

      // ❌ FIX 2: sessionStorage 완전 제거
      // (Redis 기반으로 서버에서 처리하므로 필요 없음)

      const tossPayments = (await loadTossPayments(
        process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!
      )) as unknown as TossPaymentsWithRequestPayment

      await tossPayments.requestPayment('카드', {
        amount: orderData.amount,
        orderId: orderData.orderId,
        orderName: orderData.orderName,
        customerName: normalizedEmail,
        customerEmail: normalizedEmail,
        successUrl: orderData.successUrl,
        failUrl: orderData.failUrl,
      })
    } catch (e: any) {
      setErr(e?.message || 'VIP 결제 시작 실패')
      setLoading(false)
    }
  }

  return (
    <motion.form
      onSubmit={handleVIPPayment}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="mt-8 rounded-3xl border border-emerald-300/20 bg-white/[0.06] p-5 text-left shadow-[0_0_40px_rgba(16,185,129,0.18)] backdrop-blur-xl"
    >
      <div className="mb-5 text-center">
        <div className="mx-auto mb-3 inline-flex rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-[11px] font-bold tracking-[0.22em] text-emerald-200">
          VIP SIGNUP
        </div>
        <h2 className="text-xl font-extrabold text-white">
          VIP 계정 만들기
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-slate-400">
          회원가입 없이 결제 완료 후 자동으로 계정이 생성됩니다.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="vip-email" className="text-xs font-semibold text-slate-300">
            이메일
          </label>
          <input
            id="vip-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일을 입력하세요"
            autoComplete="email"
            required
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition-all duration-300 placeholder:text-slate-500 focus:border-emerald-300/50 focus:shadow-[0_0_24px_rgba(16,185,129,0.22)]"
          />
        </div>

        <div>
          <label htmlFor="vip-password" className="text-xs font-semibold text-slate-300">
            비밀번호
          </label>
          <input
            id="vip-password"
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="비밀번호를 입력하세요"
            autoComplete="new-password"
            required
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition-all duration-300 placeholder:text-slate-500 focus:border-emerald-300/50 focus:shadow-[0_0_24px_rgba(16,185,129,0.22)]"
          />
        </div>

        {err && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-xs text-red-300"
          >
            {err}
          </motion.p>
        )}

        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: loading ? 1 : 1.025 }}
          whileTap={{ scale: loading ? 1 : 0.96 }}
          className="relative flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-300 to-cyan-300 py-4 text-base font-extrabold text-black shadow-[0_0_35px_rgba(16,185,129,0.4)] transition disabled:opacity-70"
        >
          {loading && (
            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-black/25 border-t-black" />
          )}
          {loading ? '결제 준비 중…' : 'VIP 결제하고 계정 만들기'}
        </motion.button>
      </div>
    </motion.form>
  )
}
