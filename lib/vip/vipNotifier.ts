import { getUserVIPState } from './vipDB';
import type { VIPLevel } from './vipTypes';
import { sendNotification } from '@/lib/notification/sendNotification';

const DAY = 1000 * 60 * 60 * 24;

/* VIP 업그레이드 */
export async function notifyVipUpgrade(
  userId: string,
  prev: VIPLevel,
  next: VIPLevel
) {
  if (prev === next) return;

  await sendNotification(
    userId,
    `🎉 VIP 업그레이드: ${prev} → ${next}`
  );
}

/* VIP 만료 임박 */
export async function notifyVIPExpireSoon(userId: string) {
  const state = await getUserVIPState(userId);
  if (!state?.expiredAt) return;

  const remain = state.expiredAt - Date.now();

  if (remain < DAY && remain > DAY - 60 * 60 * 1000) {
    const hours = Math.floor(remain / 3_600_000);

    await sendNotification(
      userId,
      `⏰ VIP 만료 임박: ${hours}시간 남음`
    );
  }
}
