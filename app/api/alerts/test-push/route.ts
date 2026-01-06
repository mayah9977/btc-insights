import { pushAlertTriggered } from '@/lib/push/pushOnAlert'

export async function POST() {
  await pushAlertTriggered({
    userId: 'dev-user',
    alertId: 'test',
    symbol: 'BTCUSDT',
    price: 112000,
    level: 'CRITICAL',
    ts: Date.now(), // ✅ 필수
  })

  return Response.json({ ok: true })
}
