// app/[locale]/vip/success/page.tsx

'use client'

import { useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function SuccessPage() {
  const router = useRouter()
  const params = useSearchParams()
  const calledRef = useRef(false)

  useEffect(() => {
    if (calledRef.current) return
    calledRef.current = true

    const confirm = async () => {
      try {
        const authKey = params.get('authKey')
        const customerKey = params.get('customerKey')
        const orderId = params.get('orderId')
        const plan = params.get('plan')

        if (!authKey || !customerKey || !orderId || !plan) {
          router.replace('/ko/vip/fail')
          return
        }

        const res = await fetch('/api/payment/toss/confirm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            authKey,
            customerKey,
            orderId,
            plan,
          }),
        })

        const data = await res.json()

        if (!res.ok || !data?.ok) {
          router.replace('/ko/vip/fail')
          return
        }

        // ✅ VIP 적용 후 이동
        router.refresh()
        router.replace('/ko/casino/vip')
      } catch {
        router.replace('/ko/vip/fail')
      }
    }

    confirm()
  }, [params, router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center text-white px-6">
      <h1 className="text-xl font-bold">결제 승인 처리 중...</h1>
      <p className="mt-3 text-sm text-slate-400">
        잠시만 기다려주세요. VIP 활성화를 진행 중입니다.
      </p>
    </div>
  )
}
