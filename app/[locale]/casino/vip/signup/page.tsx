// app/[locale]/casino/vip/signup/page.tsx

'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { loadTossPayments } from '@tosspayments/tosspayments-sdk'

type PlanId = 'MONTHLY' | 'HALF' | 'YEAR'

type SelectedPlan = {
  id: PlanId
  title: string
  price: string
  amount: number
  desc: string
}

type TossPaymentRequest = {
  method: 'CARD'
  amount: {
    currency: 'KRW'
    value: number
  }
  orderId: string
  orderName: string
  customerEmail: string
  customerName: string
  successUrl: string
  failUrl: string
}

type TossPaymentInstance = {
  requestPayment: (params: TossPaymentRequest) => Promise<void>
}

type TossPaymentsInstance = {
  payment: (params: { customerKey: string }) => TossPaymentInstance
}

const VALID_PLAN_AMOUNTS: Record<PlanId, number> = {
  MONTHLY: 30000,
  HALF: 150000,
  YEAR: 270000,
}

function isValidPlan(plan: unknown): plan is SelectedPlan {
  if (!plan || typeof plan !== 'object') return false

  const value = plan as Partial<SelectedPlan>

  return (
    typeof value.id === 'string' &&
    typeof value.amount === 'number' &&
    value.id in VALID_PLAN_AMOUNTS &&
    VALID_PLAN_AMOUNTS[value.id as PlanId] === value.amount &&
    typeof value.title === 'string' &&
    typeof value.price === 'string' &&
    typeof value.desc === 'string'
  )
}

function createSafeCustomerKey(email: string) {
  const normalized = email.trim().toLowerCase()
  const encoded = btoa(unescape(encodeURIComponent(normalized)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')

  return `vip_${encoded}`.slice(0, 50)
}

function isTossCancelError(e: unknown): boolean {
  const error = e as {
    code?: string
    errorCode?: string
    message?: string
  }

  const code = error?.code || error?.errorCode

  return (
    code === 'PAY_PROCESS_CANCELED' ||
    code === 'PAY_PROCESS_ABORTED' ||
    error?.message?.includes('취소') === true ||
    error?.message?.includes('canceled') === true
  )
}

export default function VIPSignupPage() {
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [selectedPlan, setSelectedPlan] =
    useState<SelectedPlan | null>(null)

  const [policyOpen, setPolicyOpen] = useState(false)
  const [agreedToPolicy, setAgreedToPolicy] = useState(false)

  const router = useRouter()
  const params = useParams()

  const locale =
    typeof params?.locale === 'string'
      ? params.locale
      : 'ko'

  const clientKey = useMemo(
    () => process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY,
    [],
  )

  useEffect(() => {
    const raw = sessionStorage.getItem('vip_selected_plan')

    if (!raw) {
      setErr('플랜 선택 정보가 없습니다. 다시 선택해주세요.')
      router.replace(`/${locale}/vip/upgrade`)
      return
    }

    try {
      const parsed = JSON.parse(raw)

      if (!isValidPlan(parsed)) {
        sessionStorage.removeItem('vip_selected_plan')
        setErr('플랜 정보가 올바르지 않습니다. 다시 선택해주세요.')
        router.replace(`/${locale}/vip/upgrade`)
        return
      }

      setSelectedPlan(parsed)
    } catch {
      sessionStorage.removeItem('vip_selected_plan')
      setErr('플랜 정보 확인에 실패했습니다. 다시 선택해주세요.')
      router.replace(`/${locale}/vip/upgrade`)
    }
  }, [locale, router])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)

    const normalizedEmail = email.trim().toLowerCase()

    if (!clientKey) {
      setErr('Toss Client Key가 설정되지 않았습니다.')
      return
    }

    if (!normalizedEmail) {
      setErr('이메일을 입력해주세요.')
      return
    }

    if (pw.length < 6) {
      setErr('비밀번호는 최소 6자 이상이어야 합니다.')
      return
    }

    if (!selectedPlan || !isValidPlan(selectedPlan)) {
      setErr('플랜 선택 정보가 없습니다. 다시 선택해주세요.')
      router.replace(`/${locale}/vip/upgrade`)
      return
    }

    if (!agreedToPolicy) {
      setPolicyOpen(true)
      setErr('환불 정책 및 투자 유의사항을 확인하고 동의해주세요.')
      return
    }

    setLoading(true)

    try {
      const payload = {
        email: normalizedEmail,
        pw,
        plan: selectedPlan.id,
        amount: selectedPlan.amount,
        locale,
      }

      console.log('[VIP_SIGNUP] create toss order', {
        email: normalizedEmail,
        plan: selectedPlan.id,
        amount: selectedPlan.amount,
        locale,
        agreedToPolicy,
      })

      const res = await fetch('/api/vip/toss/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      console.log('[VIP_SIGNUP] order response', {
        ok: res.ok,
        status: res.status,
        data,
      })

      if (!res.ok) {
        throw new Error(data?.message || '결제 주문 생성 실패')
      }

      if (!data?.orderId || !data?.amount || !data?.orderName) {
        throw new Error('결제 주문 응답이 올바르지 않습니다.')
      }

      sessionStorage.setItem(
        'vip_pending_signup',
        JSON.stringify({
          email: normalizedEmail,
          pw,
          plan: selectedPlan,
          orderId: data.orderId,
          amount: data.amount,
          agreedToPolicy: true,
          agreedAt: Date.now(),
        }),
      )

      const tossPayments = (await loadTossPayments(
        clientKey,
      )) as unknown as TossPaymentsInstance

      const payment = tossPayments.payment({
        customerKey: createSafeCustomerKey(normalizedEmail),
      })

      await payment.requestPayment({
        method: 'CARD',
        amount: {
          currency: 'KRW',
          value: data.amount,
        },
        orderId: data.orderId,
        orderName: data.orderName,
        customerEmail: normalizedEmail,
        customerName: normalizedEmail,
        successUrl: data.successUrl,
        failUrl: data.failUrl,
      })
    } catch (e: unknown) {
      if (isTossCancelError(e)) {
        setLoading(false)
        router.replace(`/${locale}/casino/vip/payment/fail`)
        return
      }

      console.error('[VIP_SIGNUP] payment start failed:', e)

      const error = e as { message?: string }
      setErr(error?.message || '결제 시작 실패')
      setLoading(false)
    }
  }

  return (
    <main className="relative min-h-[100svh] overflow-hidden flex items-center justify-center px-4 py-6 sm:py-10 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.26),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.18),transparent_32%),linear-gradient(135deg,#020617,#020617_48%,#052e2b)] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.45, 0.7, 0.45] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute left-1/2 top-12 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-400/20 blur-3xl"
        />

        <motion.div
          animate={{ scale: [1.08, 1, 1.08], opacity: [0.35, 0.58, 0.35] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute right-[-80px] bottom-[-80px] h-80 w-80 rounded-full bg-cyan-400/15 blur-3xl"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55 }}
        className="relative z-10 w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.07] p-5 backdrop-blur-2xl sm:p-8 shadow-[0_0_60px_rgba(16,185,129,0.18)]"
      >
        <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-gradient-to-br from-white/10 via-transparent to-emerald-400/10" />

        <div className="relative mb-8 text-center">
          <div className="mx-auto mb-4 inline-flex rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-1 text-xs font-semibold tracking-[0.25em] text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.25)]">
            VIP SIGNUP
          </div>

          <h1 className="text-3xl font-extrabold">
            VIP 계정 만들기
          </h1>

          {selectedPlan && (
            <p className="mt-3 text-sm text-slate-300">
              {selectedPlan.title} · {selectedPlan.price}
            </p>
          )}

          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            결제 완료 후 입력한 이메일로 VIP 계정이 생성되고 자동 로그인됩니다.
          </p>
        </div>

        <form onSubmit={onSubmit} className="relative space-y-4">
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (err) setErr(null)
            }}
            className="w-full rounded-2xl px-4 py-3 bg-black/20 border border-white/10 text-white outline-none transition-all duration-300 placeholder:text-slate-500 focus:border-emerald-300/50 focus:shadow-[0_0_24px_rgba(16,185,129,0.22)]"
            autoComplete="email"
            required
          />

          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="비밀번호"
              value={pw}
              onChange={(e) => {
                setPw(e.target.value)
                if (err) setErr(null)
              }}
              className="w-full rounded-2xl bg-black/20 border border-white/10 px-4 py-3 pr-12 text-white outline-none transition-all duration-300 placeholder:text-slate-500 focus:border-emerald-300/50 focus:shadow-[0_0_24px_rgba(16,185,129,0.22)]"
              autoComplete="new-password"
              required
            />

            <button
              type="button"
              onClick={() => setShowPw((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-slate-300 hover:text-white"
              aria-label={showPw ? '비밀번호 숨기기' : '비밀번호 보기'}
            >
              👁
            </button>
          </div>

          <div className="rounded-2xl border border-emerald-300/15 bg-black/20 shadow-[0_0_30px_rgba(16,185,129,0.10)] backdrop-blur-xl">
            <button
              type="button"
              onClick={() => setPolicyOpen((prev) => !prev)}
              className="flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-4 text-left transition hover:bg-white/[0.03]"
            >
              <div>
                <div className="text-sm font-bold text-emerald-200">
                  환불 정책 및 투자 유의사항 보기
                </div>
                <div className="mt-1 text-[11px] leading-relaxed text-slate-400">
                  결제 전 반드시 확인해야 하는 안내입니다.
                </div>
              </div>

              <motion.span
                animate={{ rotate: policyOpen ? 180 : 0 }}
                transition={{ duration: 0.25 }}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-300/20 bg-emerald-300/10 text-emerald-200"
              >
                ↓
              </motion.span>
            </button>

            <AnimatePresence initial={false}>
              {policyOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-white/10 px-4 pb-4 pt-4">
                    <div className="space-y-3 text-xs leading-relaxed text-slate-300">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                        <div className="mb-2 font-bold text-emerald-200">
                          환불 정책
                        </div>
                        <ul className="list-disc space-y-1 pl-4">
                          <li>
                            VIP 디지털 콘텐츠 및 서비스는 결제 완료 후 즉시 계정 생성 및 권한 활성화가 진행됩니다.
                          </li>
                          <li>
                            서비스 이용이 시작된 이후에는 전자상거래법 및 관련 약관에 따라 환불이 제한될 수 있습니다.
                          </li>
                          <li>
                            중복 결제, 시스템 오류, 결제 승인 실패 등 명백한 기술적 문제가 확인되는 경우 내부 검토 후 환불 또는 정정 처리될 수 있습니다.
                          </li>
                          <li>
                            단순 변심, 투자 손실, 시장 변동, 개인 매매 판단 결과는 환불 사유에 해당하지 않습니다.
                          </li>
                        </ul>
                      </div>

                      <div className="rounded-2xl border border-yellow-300/20 bg-yellow-300/[0.06] p-4">
                        <div className="mb-2 font-bold text-yellow-200">
                          투자 및 트레이딩 유의사항
                        </div>
                        <ul className="list-disc space-y-1 pl-4">
                          <li>
                            VIP 콘텐츠는 투자 참고용 정보이며, 특정 자산의 매수·매도·보유를 권유하지 않습니다.
                          </li>
                          <li>
                            암호화폐, 선물, 레버리지 거래는 원금 손실 가능성이 매우 높으며, 손실은 전적으로 이용자 본인에게 귀속됩니다.
                          </li>
                          <li>
                            제공되는 분석, 시그널, 지표, 알림은 시장 상황에 따라 지연되거나 부정확할 수 있습니다.
                          </li>
                          <li>
                            과거 수익률, 백테스트, 예측 자료는 미래 수익을 보장하지 않습니다.
                          </li>
                        </ul>
                      </div>

                      <div className="rounded-2xl border border-red-300/20 bg-red-400/[0.06] p-4">
                        <div className="mb-2 font-bold text-red-200">
                          책임 제한 안내
                        </div>
                        <ul className="list-disc space-y-1 pl-4">
                          <li>
                            이용자는 본인의 판단과 책임하에 거래를 진행해야 합니다.
                          </li>
                          <li>
                            본 서비스는 금융투자업 인가를 받은 투자자문 서비스가 아니며, 법적·재무적·세무적 자문을 제공하지 않습니다.
                          </li>
                          <li>
                            결제 진행 시 위 내용을 충분히 이해하고 동의한 것으로 간주됩니다.
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left transition hover:border-emerald-300/30 hover:bg-emerald-300/[0.04]">
            <input
              type="checkbox"
              checked={agreedToPolicy}
              onChange={(e) => {
                setAgreedToPolicy(e.target.checked)
                if (err) setErr(null)
              }}
              className="mt-1 h-4 w-4 rounded border-white/20 bg-black accent-emerald-400"
            />

            <span className="text-xs leading-relaxed text-slate-300">
              환불 정책, 투자 위험, 책임 제한 안내를 모두 확인했으며 이에 동의합니다.
              <span className="block pt-1 text-[11px] text-emerald-300/80">
                동의 후 결제 버튼이 활성화됩니다.
              </span>
            </span>
          </label>

          <button
            type="submit"
            disabled={loading || !selectedPlan || !agreedToPolicy}
            className="w-full rounded-2xl bg-emerald-400 py-3 font-bold text-black shadow-[0_0_28px_rgba(16,185,129,0.28)] transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? '결제 진행 중...' : '결제하기'}
          </button>

          {err && (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
            >
              {err}
            </motion.p>
          )}
        </form>
      </motion.div>
    </main>
  )
}
