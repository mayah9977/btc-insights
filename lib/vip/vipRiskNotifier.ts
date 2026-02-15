import { sendNotification } from '@/lib/notification/sendNotification'

const COOLDOWN = 1000 * 60 * 30 // 30분

const lastNotifiedMap = new Map<string, number>()

export async function notifyVipExtreme(
  userId: string,
) {
  const now = Date.now()
  const last = lastNotifiedMap.get(userId) ?? 0

  // 쿨타임
  if (now - last < COOLDOWN) return

  lastNotifiedMap.set(userId, now)

  await sendNotification(
    userId,
    '🚨 EXTREME 리스크 감지 — 즉시 대응 필요'
  )
}
