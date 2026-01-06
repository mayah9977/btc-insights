// @ts-nocheck
import { getFirebaseAdmin } from './firebaseAdmin';
import { listPushTokens } from './pushTokenStore';

export async function sendFCM(userId: string, message: string) {
  const tokens = await listPushTokens(userId);

  if (!tokens.length) {
    console.warn('[FCM] no tokens for user:', userId);
    return;
  }

  const admin = getFirebaseAdmin();

  const res = await admin.messaging().sendMulticast({
    tokens,
    notification: {
      title: 'BTC 알림',
      body: message.slice(0, 180),
    },
    data: {
      userId,
    },
  });

  // 실패 토큰 정리(운영 시: DB에서 제거)
  if (res.failureCount > 0) {
    console.warn('[FCM] failureCount:', res.failureCount);
  }
}
