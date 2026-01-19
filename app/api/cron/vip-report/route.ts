import { generateVipDailyReportPdf } from '@/lib/vip/report/vipDailyReportPdf'
import { redis } from '@/lib/redis'

export async function GET() {
  const raw = await redis.get('vip:metrics:daily')

  if (!raw) {
    return new Response(
      JSON.stringify({ ok: false, reason: 'no daily data' }),
      { status: 404 }
    )
  }

  const data = JSON.parse(raw)

  const pdfBytes = await generateVipDailyReportPdf({
  date: new Date().toISOString().slice(0, 10),
  market: 'BTC',
  vipLevel: 'VIP3', // ✅ 추가
  riskLevel: 'HIGH',
  judgement: `EXTREME 회피 ${data.avoidedExtremeCount}회`,
  scenarios: [],
})

  // ✅ Node / Edge 안전
  const safeBytes = new Uint8Array(pdfBytes)

  return new Response(safeBytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="vip-daily-report.pdf"',
      'Cache-Control': 'no-store',
    },
  })
}
