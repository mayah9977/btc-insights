import { NextResponse } from 'next/server'
import { getUserVIP } from '@/lib/auth/getUserVIP'
import { deleteNotification } from '@/lib/notification/repository'

export async function POST(req: Request) {
  try {
    const viewerId = 'local'
    await getUserVIP('local')

    let body: { id?: string } = {}

    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        { ok: false, reason: 'invalid-json-body' },
        { status: 400 },
      )
    }

    if (!body.id) {
      return NextResponse.json(
        { ok: false, reason: 'missing-id' },
        { status: 400 },
      )
    }

    await deleteNotification({
      viewerId,
      id: body.id,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[DELETE_NOTIFICATION]', error)

    return NextResponse.json(
      { ok: false },
      { status: 500 },
    )
  }
}
