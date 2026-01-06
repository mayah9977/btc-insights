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

  // ⚠️ 실제 서비스에서는 세션 / DB / 결제 정보로 대체
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
   * (예: 신규 VIP, 첫 방문 세션)
   * 실제 서비스에서는 DB flag로 대체
   */
  const isFirstVIPEntry = false
  if (isFirstVIPEntry) {
    redirect(`/${locale}/casino/vip/onboarding`)
  }

  // ✅ VIP 메인 UI는 Client Component에서 렌더링
  return <VIPClientPage vipLevel={vipLevel} />
}
