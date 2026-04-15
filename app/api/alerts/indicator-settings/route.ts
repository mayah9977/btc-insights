// /app/api/alerts/indicator-settings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { setIndicatorEnabled } from '@/lib/alerts/indicatorEngine'
import { redis } from '@/lib/redis' // 🔥 [기존] Redis 사용

export const runtime = 'nodejs'

/* =========================
 * 🔥 Redis Key
 * ========================= */
const REDIS_KEY = 'alerts:indicator:enabled'

/* =========================
 * GET → Redis에서 상태 조회
 * ========================= */
export async function GET() {
  try {
    const raw = await redis.get(REDIS_KEY)

    if (!raw) {
      // 🔥 [수정] fallback 생성 + Redis 저장 추가
      const fallback = {
        RSI: true,
        MACD: true,
        EMA: true,
      }

      /* =========================
       * 🔥 [추가] Redis에 fallback 저장
       * ========================= */
      try {
        await redis.set(REDIS_KEY, JSON.stringify(fallback))
        console.log('[indicator-settings][GET] fallback saved to Redis')
      } catch (err) {
        console.error('[indicator-settings][GET][SET ERROR]', err)
      }

      return NextResponse.json({
        ok: true,
        data: fallback,
      })
    }

    const parsed = JSON.parse(raw)

    return NextResponse.json({
      ok: true,
      data: parsed,
    })
  } catch (e) {
    console.error('[indicator-settings][GET]', e)

    // 🔥 [보완] 에러 시에도 fallback 생성 + Redis 저장 시도
    const fallback = {
      RSI: true,
      MACD: true,
      EMA: true,
    }

    try {
      await redis.set(REDIS_KEY, JSON.stringify(fallback))
      console.log('[indicator-settings][GET][ERROR FALLBACK SAVED]')
    } catch {}

    return NextResponse.json({
      ok: false,
      data: fallback,
    })
  }
}

/* =========================
 * POST → Redis 저장 + 메모리 반영
 * ========================= */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const next = {
      RSI: !!body?.RSI,
      MACD: !!body?.MACD,
      EMA: !!body?.EMA,
    }

    /* 🔥 Redis 저장 */
    await redis.set(REDIS_KEY, JSON.stringify(next))

    /* 🔥 메모리 반영 */
    setIndicatorEnabled(next)

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[indicator-settings][POST]', e)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
