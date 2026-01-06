import { NextResponse } from 'next/server'

export async function GET() {
  const apiKey = process.env.BINANCE_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'BINANCE_API_KEY missing' },
      { status: 500 }
    )
  }

  try {
    const res = await fetch(
      'https://fapi.binance.com/fapi/v1/listenKey',
      {
        method: 'POST',
        headers: {
          'X-MBX-APIKEY': apiKey,
        },
      }
    )

    const data = await res.json()

    return NextResponse.json({
      listenKey: data.listenKey,
    })
  } catch (e) {
    return NextResponse.json(
      { error: 'Failed to create listenKey' },
      { status: 500 }
    )
  }
}
