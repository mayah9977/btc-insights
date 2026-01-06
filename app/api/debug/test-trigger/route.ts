import { NextResponse } from 'next/server'
import { handlePriceTick } from '@/lib/alerts/alertEngine'

export async function POST() {
  console.log('==============================')
  console.log('[TEST TRIGGER] API CALLED')

  const tick = {
    symbol: 'BTCUSDT',
    price: 80001,
  }

  console.log('[TEST TRIGGER] tick =', tick)

  try {
    await handlePriceTick(tick)
    console.log('[TEST TRIGGER] handlePriceTick DONE')
  } catch (err) {
    console.error('[TEST TRIGGER] ERROR', err)
  }

  console.log('==============================')

  return NextResponse.json({ ok: true })
}
