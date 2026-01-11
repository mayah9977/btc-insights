import { redirect } from 'next/navigation'
import VIPClientPage from './vipClientPage'
import { calcVIPLevel } from '../lib/vipAccess'

type PageProps = {
  params: Promise<{
    locale: string
  }>
}

export default async function VIPPage({ params }: PageProps) {
  const { locale } = await params

  /**
   * ⚠️ 임시 VIP 판별 로직
   * 실제 서비스에서는:
   * - 세션
   * - 결제 정보
   * - DB VIP flag
   * 로 대체
   */
  const vipLevel = calcVIPLevel({
    hasPayment: true,
    daysUsed: 20,
    roi: 12,
  })

  // ❌ FREE 유저 차단
  if (vipLevel === 'FREE') {
    redirect(`/${locale}/login`)
  }

  /**
   * ✅ VIP 첫 진입 온보딩 분기
   * (실서비스에서는 DB flag로 대체)
   */
  const isFirstVIPEntry = false
  if (isFirstVIPEntry) {
    redirect(`/${locale}/casino/vip/onboarding`)
  }

  /**
   * ✅ VIP 리포트 UI는 Client Component에서 조립
   * (판단/시나리오/히스토리 시각화)
   */
  return <VIPClientPage vipLevel={vipLevel} />
}
