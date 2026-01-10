import { adminMessaging } from '@/lib/firebase-admin'

type PushPayload = {
  token: string
  title: string
  body: string
  data?: Record<string, string>
}

export async function sendPushNotification({
  token,
  title,
  body,
  data = {},
}: PushPayload) {
  if (!token) return

  await adminMessaging.send({
    token,
    notification: {
      title,
      body,
    },
    data,
  })
}
