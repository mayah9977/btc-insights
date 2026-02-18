// app/api/vip/report/pdf/route.ts

import { NextResponse } from 'next/server'
import { generateVipDailyReportPdf } from '@/lib/vip/report/vipDailyReportPdf'
import { redis } from '@/lib/redis/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const { chartBase64 }: { chartBase64?: string } = body

    if (!chartBase64) {
      return NextResponse.json(
        { error: 'chartBase64 required' },
        { status: 400 }
      )
    }

    /**
     * 1️⃣ Telegram chatId 조회
     */
    const chatId = await redis.get('vip:pending:chat')
    if (!chatId) {
      return NextResponse.json(
        { error: 'telegram chatId not found' },
        { status: 400 }
      )
    }

    /**
     * 2️⃣ PDF 생성 (최신 DailyReportInput 구조에 맞춤)
     */
    const pdfBuffer = await generateVipDailyReportPdf({
      date: new Date().toISOString().slice(0, 10),
      market: 'BTC',
      vipLevel: 'VIP3',

      btcPrice: 0,
      openInterest: 0,
      fundingRate: 0,
      candleChartBase64: chartBase64,

      whaleIntensity: 0,
      whaleInterpretation: 'Whale data not available',

      sentimentIndex: 50,
      sentimentRegime: 'NEUTRAL',
      sentimentInterpretation: 'Market sentiment neutral',

      newsSummary: 'No news summary available',
      newsMidLongTerm: 'No structural outlook available',
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

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[VIP PDF API ERROR]', err)

    return NextResponse.json(
      { error: 'PDF generation failed' },
      { status: 500 }
    )
  }
}
