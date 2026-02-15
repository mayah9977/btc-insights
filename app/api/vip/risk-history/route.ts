// app/api/vip/risk-history/route.ts
import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis/index'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic' // ✅ 캐시 방지 (중요)

export async function GET() {
  // ---------------------------------------------
  // ⭕ [ADD] Redis 기반 실제 RiskEvent 타임라인
  // ---------------------------------------------
  const keys = await redis.keys('vip:risk:event:*')

  const events = await Promise.all(
    keys.map(async (key) => {
      const e = await redis.hgetall(key)
      return {
        ts: Number(e.timestamp),
        riskLevel: e.riskLevel,
        judgement: e.reason || '',
      }
    }),
  )

  // 최신순 정렬
  events.sort((a, b) => b.ts - a.ts)

  return NextResponse.json(events, {
    headers: {
      'Cache-Control': 'no-store',
    },
  })

  // ---------------------------------------------
  // ❌ 기존 mock 데이터 (보존 대상, 실행되지 않음)
  // ---------------------------------------------
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
