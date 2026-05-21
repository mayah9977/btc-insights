//app/api/notification/save/route.ts 

import { NextResponse } from 'next/server'
import { saveNotification } from '@/lib/notification/repository'

export async function POST(req: Request) {
  try {
    let body: unknown = null

    // 🔥 NEW: req.json 안정화
    try {
      body = await req.json()
    } catch (error) {
      console.error('[SAVE_NOTIFICATION] invalid json body:', error)

      return NextResponse.json(
        { ok: false, reason: 'invalid-json-body' },
        { status: 400 },
      )
    }

    // 🔥 NEW: empty body 방어
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { ok: false, reason: 'empty-body' },
        { status: 400 },
      )
    }

    await saveNotification(body as any)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[SAVE_NOTIFICATION]', error)

    return NextResponse.json(
      { ok: false },
      { status: 500 },
    )
  }
}
