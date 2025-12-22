import type { VIPLevel } from './vipAccess';

type PushPayload = {
  userId: string;
  message: string;
};

export async function sendServerVIPPush(
  vipLevel: VIPLevel,
  payload: PushPayload
) {
  if (vipLevel !== 'VIP3') return;

  // TODO: WebPush / FCM / SSE 연동
  console.log('[VIP3 PUSH]', {
    priority: 'HIGH',
    ...payload,
  });
}
