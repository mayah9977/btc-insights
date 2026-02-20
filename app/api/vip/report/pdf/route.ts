import { NextResponse } from 'next/server'
import { generateVipDailyReportPdf } from '@/lib/vip/report/vipDailyReportPdf'
import { redis } from '@/lib/redis/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
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
     * 2️⃣ PDF 생성 (최신 DailyReportInput 구조)
     *    → 뉴스 + 온체인 중심 구조
     */
    const pdfBuffer = await generateVipDailyReportPdf({
      date: new Date().toISOString().slice(0, 10),
      market: 'BTC',
      vipLevel: 'VIP3',

      newsSummary: 'No news summary available',
      newsMidLongTerm: 'No structural outlook available',

      externalOnchainSource: 'Internal Engine',
      externalOnchainSummary: 'No on-chain analysis available',

      fusionTacticalBias: 'Neutral',
      fusionStructuralOutlook: 'No structural data',
      fusionRiskRegime: 'Neutral',
      fusionPositioningPressure: 'No positioning signal',
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