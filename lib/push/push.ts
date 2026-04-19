// lib/push/push.ts

import { sendPush } from './pushSender'

type PushPayload = {
  title: string
  body: string
  data?: Record<string, string>
}

export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
) {
  console.log('[PUSH]', userId, payload)

  // 🔥 핵심: 실제 FCM 발송 연결
  return await sendPush({
    userId,
    title: payload.title,
    body: payload.body,
    data: payload.data,
  })
}
