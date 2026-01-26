// app/api/vip/report/pdf/route.ts
import { NextResponse } from 'next/server'
import {
  generateVipDailyReportPdf,
  ExtremeZone,
} from '@/lib/vip/report/vipDailyReportPdf'
import { redis } from '@/lib/redis'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      chartBase64,
      extremeZones,
    }: {
      chartBase64: string
      extremeZones?: ExtremeZone[]
    } = body

    if (!chartBase64) {
      return NextResponse.json(
        { error: 'chartBase64 required' },
        { status: 400 }
      )
    }

    /**
     * 1️⃣ Telegram chatId 조회
     * - Webhook에서 미리 저장해둔 값
     */
    const chatId = await redis.get('vip:pending:chat')
    if (!chatId) {
      return NextResponse.json(
        { error: 'telegram chatId not found' },
        { status: 400 }
      )
    }

    /**
     * 2️⃣ PDF 생성
     */
    const pdfBuffer = await generateVipDailyReportPdf({
      date: new Date().toISOString().slice(0, 10),
      market: 'BTCUSDT',
      vipLevel: 'VIP3',
      riskLevel: 'HIGH',
      judgement:
        '현재 시장은 EXTREME 구간에 진입했으며 변동성 확대 가능성이 높습니다.',
      scenarios: [
        { title: '상승 지속', probability: 45 },
        { title: '조정 후 재상승', probability: 35 },
        { title: '급락', probability: 20 },
      ],
      chartBase64,
      extremeZones,
    })

    /**
     * 3️⃣ Telegram 전송
     */
    const form = new FormData()
    form.append('chat_id', String(chatId))
    form.append(
      'document',
      new Blob([new Uint8Array(pdfBuffer)], {
        type: 'application/pdf',
      }),
      `VIP_DAILY_REPORT_${Date.now()}.pdf`
    )

    const tgRes = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendDocument`,
      {
        method: 'POST',
        body: form,
      }
    )

    if (!tgRes.ok) {
      const errText = await tgRes.text()
      throw new Error(`Telegram send failed: ${errText}`)
    }

    /**
     * 4️⃣ Client 응답 (성공)
     */
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[VIP PDF API ERROR]', err)
    return NextResponse.json(
      { error: 'PDF generation failed' },
      { status: 500 }
    )
  }
}
