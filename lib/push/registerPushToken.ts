import { getToken } from 'firebase/messaging'
import { messaging } from './firebase'

export async function registerPushToken() {
  const permission =
    await Notification.requestPermission()

  if (permission !== 'granted') return null

  const token = await getToken(messaging, {
    vapidKey: 'YOUR_VAPID_KEY',
  })

  // TODO: 이 token을 서버에 저장 (VIP3 전용)
  return token
}
