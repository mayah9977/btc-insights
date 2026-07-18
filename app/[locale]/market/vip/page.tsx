// app/[locale]/market/vip/page.tsx

import { redirect } from 'next/navigation'

import VIPClientPage from './vipClientPage'

import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { isVIP } from '@/lib/vip/vipServer'

type PageProps = {
  params: Promise<{
    locale: string
  }>
}

export default async function VIPPage({
  params,
}: PageProps) {
  const { locale } = await params

  /**
   * 🔥 수정 이유:
   * 기존 auth / redis / firebase 구조 유지
   * 현재 session 기반 사용자 판별 그대로 사용
   */
  const user = await getCurrentUser()

  const userId = user?.id ?? null

  /**
   * 🔥 수정 이유:
   * 기존 VIP 판별 구조 그대로 사용
   * ADMIN_EMAILS / VIP DB / admin user 처리 유지
   */
  const vip =
    userId ? await isVIP(userId) : false

  /**
   * 🔥 수정 이유:
   * VIP 사용자는 기존 VIPClientPage 렌더
   * 기존 mobile/desktop/VIP logic 유지
   */
  if (vip && userId) {
    return (
      <VIPClientPage
        locale={locale}
        userId={userId}
        isVIP={true}
        weeklySummary={null}
        monthlySummary={null}
        vip3Metrics={null}
      />
    )
  }

  /**
   * 🔥 수정 이유:
   * 일반 사용자는 기존 Toss 결제 flow 사용
   * payment flow 중복 구현 금지
   * 기존 /vip/upgrade 구조 그대로 활용
   */
  redirect(`/${locale}/vip/upgrade`)
}
