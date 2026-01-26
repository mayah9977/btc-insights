// app/api/vip/risk-history/route.ts
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic' // ✅ 캐시 방지 (중요)

export async function GET() {
  return NextResponse.json(
    [
      {
        ts: Date.now() - 1000 * 60 * 45,
        riskLevel: 'MEDIUM',
        judgement: '변동성 증가',
      },
      {
        ts: Date.now() - 1000 * 60 * 25,
        riskLevel: 'HIGH',
        judgement: '고래 체결 집중',
      },
      {
        ts: Date.now() - 1000 * 60 * 5,
        riskLevel: 'EXTREME',
        judgement: '급격한 방향성 붕괴',
      },
    ],
    {
      headers: {
        'Cache-Control': 'no-store', // ✅ 브라우저 캐시 차단
      },
    },
  )
}
