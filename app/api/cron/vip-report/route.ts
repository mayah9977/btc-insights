import { generateVipDailyReportPdf } from '@/lib/vip/report/vipDailyReportPdf'
import { redis } from '@/lib/redis/server'

export async function GET() {
  const raw = await redis.get('vip:metrics:daily')

  if (!raw) {
    return new Response(
      JSON.stringify({ ok: false, reason: 'no daily data' }),
      { status: 404 },
    )
  }

  const data = JSON.parse(raw)

  // ✅ 차트 이미지 생성 (없으면 빈 placeholder)
  const chartBase64 = 'data:image/png;base64,'

  const pdfBytes = await generateVipDailyReportPdf({
    date: new Date().toISOString().slice(0, 10),
    market: 'BTC',
    vipLevel: 'VIP3',
    riskLevel: 'HIGH',
    judgement: `EXTREME 회피 ${data.avoidedExtremeCount}회`,
    scenarios: [],
    chartBase64, // ✅ 핵심 추가
  })

  const safeBytes = new Uint8Array(pdfBytes)

  return new Response(safeBytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition':
        'inline; filename="vip-daily-report.pdf"',
      'Cache-Control': 'no-store',
    },
  })
}
