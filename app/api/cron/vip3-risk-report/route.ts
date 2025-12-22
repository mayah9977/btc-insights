import { analyzeRiskPnLCorrelation } from '@/lib/analysis/riskPnlCorrelation'

export const runtime = 'nodejs'

export async function GET() {
  // PDF API를 내부 호출하는 대신
  // 여기서는 "리포트 생성 이벤트"만 트리거
  const stats = analyzeRiskPnLCorrelation()

  console.log('[CRON] VIP3 Risk Report Generated', {
    at: new Date().toISOString(),
    stats,
  })

  return Response.json({
    ok: true,
    message: 'VIP3 risk report cron executed',
  })
}
