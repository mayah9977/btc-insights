import { NextResponse } from 'next/server'
import { saveNotification } from '@/lib/notification/repository'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    await saveNotification(body)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[SAVE_NOTIFICATION]', error)

    return NextResponse.json(
      { ok: false },
      { status: 500 },
    )
  }
}
