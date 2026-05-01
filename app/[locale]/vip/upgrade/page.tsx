// app/[locale]/vip/upgrade/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import VIPUpgradeHero from './VIPUpgradeHero'

declare global {
  interface Window {
    TossPayments: any
  }
}

type Plan = {
  id: 'MONTHLY' | 'HALF' | 'YEAR'
  title: string
  price: string
  amount: number
  desc: string
}

const plans: Plan[] = [
  {
    id: 'MONTHLY',
    title: '1개월 VIP',
    price: '₩30,000',
    amount: 30000,
    desc: '가장 기본 플랜',
  },
  {
    id: 'HALF',
    title: '6개월 VIP',
    price: '₩150,000',
    amount: 150000,
    desc: '🔥 가장 인기',
  },
  {
    id: 'YEAR',
    title: '12개월 VIP',
    price: '₩270,000',
    amount: 270000,
    desc: '최대 할인',
  },
]

export default function VIPUpgradePage() {
  const router = useRouter()
  const params = useParams()
  const locale = params?.locale || 'ko'

  const [selected, setSelected] = useState<Plan>(plans[1])
  const [loading, setLoading] = useState(false)
  const [tossLoaded, setTossLoaded] = useState(false)

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://js.tosspayments.com/v1/payment'
    script.async = true
    script.onload = () => setTossLoaded(true)
    document.body.appendChild(script)
  }, [])

  const handlePayment = async () => {
    if (!tossLoaded) return alert('결제 모듈 로딩 중입니다.')

    setLoading(true)

    try {
      const res = await fetch('/api/payment/toss/register-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selected.id }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data?.error || 'register failed')

      const { clientKey, orderId, customerKey } = data

      const tossPayments = window.TossPayments(clientKey)

      await tossPayments.requestBillingAuth('카드', {
        customerKey,
        successUrl: `${window.location.origin}/${locale}/vip/success?orderId=${orderId}&plan=${selected.id}`,
        failUrl: `${window.location.origin}/${locale}/vip/fail`,
      })
    } catch (err) {
      alert('결제 요청 실패')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-black text-white px-5 py-10">
      <div className="mx-auto max-w-xl">
        <VIPUpgradeHero />

        <div className="mt-10 space-y-4">
          {plans.map((plan) => {
            const active = selected.id === plan.id

            return (
              <button
                key={plan.id}
                onClick={() => setSelected(plan)}
                className={`w-full rounded-2xl border p-5 text-left transition ${
                  active
                    ? 'border-emerald-400 bg-emerald-400/10'
                    : 'border-white/10 bg-white/5'
                }`}
              >
                <div className="flex justify-between">
                  <div>
                    <div className="text-lg font-bold">
                      {plan.title}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {plan.desc}
                    </div>
                  </div>

                  <div className="text-xl font-bold">
                    {plan.price}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        <button
          onClick={handlePayment}
          disabled={loading}
          className="mt-10 w-full rounded-2xl bg-gradient-to-r from-emerald-400 to-emerald-600 py-4 font-bold text-black text-lg disabled:opacity-50"
        >
          {loading
            ? '결제 진행 중...'
            : `${selected.price} 결제하기`}
        </button>
      </div>
    </main>
  )
}
