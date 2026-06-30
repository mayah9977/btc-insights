import type { VIPLevel } from './vipAccess';

/**
 * TODO: 실제 서비스에서는 DB로 교체
 */
const vipDB = new Map<string, VIPLevel>();

export async function setVIPLevel(userId: string, level: VIPLevel) {
  vipDB.set(userId, level);
}

export async function getVIPLevel(userId: string): Promise<VIPLevel> {
  return vipDB.get(userId) ?? 'FREE';
}
