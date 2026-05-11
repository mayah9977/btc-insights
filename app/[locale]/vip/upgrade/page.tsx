// app/[locale]/vip/upgrade/page.tsx

'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

import VIPUpgradeHero from './VIPUpgradeHero'

import type { VIPPlan } from '@/lib/payments/vipPlans'

type Plan = {
  id: VIPPlan
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

  const locale =
    typeof params?.locale === 'string'
      ? params.locale
      : 'ko'

  const [selected, setSelected] =
    useState<Plan>(plans[1])

  const [loading, setLoading] =
    useState(false)

  const handlePayment = async () => {
    setLoading(true)

    try {
      sessionStorage.setItem(
        'vip_selected_plan',
        JSON.stringify(selected),
      )

      console.log(
        '[VIP_UPGRADE] selected plan saved',
        {
          selectedPlan: selected,
        },
      )

      router.push(`/${locale}/casino/vip/signup`)
    } catch (err) {
      console.error(
        '[VIP_UPGRADE] plan save failed',
        err,
      )

      alert(
        '플랜 선택 처리 중 오류가 발생했습니다.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main
      className="
        min-h-screen
        overflow-visible
        bg-black
        text-white
        px-5
        pt-16
        pb-10
        sm:pt-14
      "
    >
      {/* =========================
          Background Glow
      ========================= */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="
            absolute
            top-[-120px]
            left-1/2
            h-[260px]
            w-[260px]
            -translate-x-1/2
            rounded-full
            bg-emerald-400/10
            blur-3xl
          "
        />
      </div>

      <div
        className="
          relative
          z-10
          mx-auto
          max-w-xl
        "
      >
        <VIPUpgradeHero />

        <div className="mt-10 space-y-4">
          {plans.map((plan) => {
            const active =
              selected.id === plan.id

            return (
              <button
                key={plan.id}
                onClick={() =>
                  setSelected(plan)
                }
                className={`w-full rounded-2xl border p-5 text-left transition ${
                  active
                    ? 'border-emerald-400 bg-emerald-400/10 shadow-[0_0_25px_rgba(16,185,129,0.12)]'
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
          className="
            mt-10
            w-full
            rounded-2xl
            bg-gradient-to-r
            from-emerald-400
            to-emerald-600
            py-4
            font-bold
            text-black
            text-lg
            shadow-[0_0_35px_rgba(16,185,129,0.35)]
            transition-all
            duration-300
            hover:scale-[1.01]
            disabled:opacity-50
          "
        >
          {loading
            ? '이동 중...'
            : `${selected.price} 결제 진행하기`}
        </button>
      </div>
    </main>
  )
}
