import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/getCurrentUser'
import { deleteNotification } from '@/lib/notification/repository'

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Unauthorized',
        },
        { status: 401 },
      )
    }

    const viewerId = user.id

    let body: { id?: string } = {}

    try {
      body = await req.json()
    } catch {}

    if (!body.id) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Missing id',
        },
        { status: 400 },
      )
    }

    const result = await deleteNotification({
      viewerId,
      id: body.id,
    })

    return NextResponse.json({
      ok: true,
      deleted: result,
    })
  } catch (error) {
    console.error('[DELETE_NOTIFICATION]', error)

    return NextResponse.json(
      { ok: false },
      { status: 500 },
    )
  }
}
