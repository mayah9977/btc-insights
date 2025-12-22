import { VIPLevel } from './vipTypes';

const adminUsers = new Map<string, VIPLevel>();

export function setAdminVIP(userId: string, level: VIPLevel) {
  adminUsers.set(userId, level);
}

export function getAdminVIP(userId: string): VIPLevel | null {
  return adminUsers.get(userId) ?? null;
}

export function isAdminUser(userId: string): boolean {
  return adminUsers.has(userId);
}
