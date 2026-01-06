import { sendPush } from '@/lib/push/pushSender'

export type WebPushPayload = {
  userId: string
  title: string
  body: string
  data?: any
}

/**
 * 실제 Push 발송 (실패 시 throw)
 */
export async function sendWebPush(payload: WebPushPayload) {
  const result = await sendPush(payload)

  if (!result.ok) {
    throw new Error('PUSH_SEND_FAILED')
  }

  return true
}
