import { getUserVIPState } from './vipDB';

const DAY = 1000 * 60 * 60 * 24;

export async function notifyVIPExpireSoon(userId: string) {
  const state = await getUserVIPState(userId);
  if (!state) return;

  const remain = state.expiredAt - Date.now();

  if (remain < DAY && remain > DAY - 1000 * 60 * 60) {
    console.log(`🔔 VIP 만료 임박: ${userId} (${Math.floor(remain / 3600000)}시간 남음)`);
  }
}
