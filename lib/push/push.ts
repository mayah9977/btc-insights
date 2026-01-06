// lib/push/push.ts
type PushPayload = {
  title: string
  body: string
  data?: any
}

export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
) {
  console.log('[PUSH]', userId, payload)
  // TODO: FCM Admin 연동
}
