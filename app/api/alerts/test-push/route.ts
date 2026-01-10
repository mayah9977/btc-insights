import { pushAlertTriggered } from '@/lib/push/pushOnAlert'
import { getUserNotificationSettings } from '@/lib/notification/settingsStore'

export async function POST() {
  const userId = 'dev-user'

  // 1️⃣ 사용자 알림 설정 로드
  const settings = await getUserNotificationSettings(userId)

  // 2️⃣ 최종 합격 테스트용 (CRITICAL)
  const level: 'CRITICAL' = 'CRITICAL'

  // 3️⃣ Quiet Hours 필터
  if (settings?.quietHours) {
    const hour = new Date().getHours()
    const { from, to } = settings.quietHours

    const inQuietHours =
      from < to
        ? hour >= from && hour < to
        : hour >= from || hour < to

    if (inQuietHours) {
      console.log('[PUSH][BLOCKED] quiet-hours')
      return Response.json({ ok: true, blocked: 'quiet-hours' })
    }
  }

  // 4️⃣ Importance 필터
  if (settings?.importance === 'CRITICAL_ONLY' && level !== 'CRITICAL') {
    console.log('[PUSH][BLOCKED] importance')
    return Response.json({ ok: true, blocked: 'importance' })
  }

  // 5️⃣ Push 발사 (최종 검증)
  await pushAlertTriggered({
    userId,
    alertId: 'test',
    symbol: 'BTCUSDT',
    price: 112000,
    level,
    ts: Date.now(),
  })

  return Response.json({ ok: true })
}
