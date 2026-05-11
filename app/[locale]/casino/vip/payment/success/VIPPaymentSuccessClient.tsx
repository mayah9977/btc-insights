// app/[locale]/casino/vip/payment/success/VIPPaymentSuccessClient.tsx

'use client'

import { useEffect } from 'react'

type VIPPaymentSuccessClientProps = {
  locale?: string
  paymentKey?: string
  orderId?: string
  amount?: string | number
}

/**
 * 🔥 수정 이유:
 * 기존 VIPPaymentSuccessClient는 legacy 중복 success flow였습니다.
 *
 * 현재 최종 flow는:
 * app/[locale]/casino/vip/payment/success/page.tsx
 * 에서 단일 처리합니다.
 *
 * 이 컴포넌트는 기존 import가 남아 있어도
 * 중복 confirm / 중복 activate / 중복 Firebase 생성이 발생하지 않도록
 * 완전 비활성화합니다.
 */
export default function VIPPaymentSuccessClient(
  _props: VIPPaymentSuccessClientProps,
) {
  useEffect(() => {
    console.log(
      '[VIPPaymentSuccessClient] legacy component disabled. success/page.tsx handles the final VIP flow.',
    )
  }, [])

  return null
}
