import { generateVipDailyReportPdf } from '@/lib/vip/report/vipDailyReportPdf'

export async function GET() {
  const pdfBytes = await generateVipDailyReportPdf({
    date: '2025-01-02',
    market: 'BTCUSDT',
    vipLevel: 'VIP3',
    riskLevel: 'HIGH',
    judgement: '시장 변동성 주의',
    scenarios: [
      { title: '상승 지속', probability: 45 },
      { title: '조정 후 반등', probability: 35 },
    ],

    // ✅ 필수 추가 (server placeholder)
    chartBase64: 'data:image/png;base64,',
  })

  return new Response(new Uint8Array(pdfBytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Cache-Control': 'no-store',
    },
  })
}
