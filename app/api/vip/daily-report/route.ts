// app/api/vip/daily-report/route.ts

import { generateVipDailyReportPdf } from '@/lib/vip/report/vipDailyReportPdf'

export const runtime = 'nodejs'

export async function GET() {
  const pdfBytes = await generateVipDailyReportPdf({
    date: '2025-01-02',
    market: 'BTCUSDT',
    vipLevel: 'VIP3',
    riskLevel: 'HIGH',
    judgement: '과열 구간으로 신규 진입 비추천',
    scenarios: [
      { title: '돌파 실패 → 급락', probability: 62 },
    ],
  })

  // Node.js 환경에서 PDF 바이너리 반환
  const buffer = Buffer.from(pdfBytes)

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="vip-report.pdf"',
    },
  })
}
