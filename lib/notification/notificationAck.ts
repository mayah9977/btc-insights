/**
 * 🔔 Notification 읽음(Ack) 상태 관리
 * - UI 전용 (서버 영속화 X)
 * - 세션 동안만 유지
 */

const readSet = new Set<string>();

export function markNotificationAsRead(id: string) {
  readSet.add(id);
}

export function isNotificationRead(id: string): boolean {
  return readSet.has(id);
}

export function resetNotificationReadState() {
  readSet.clear();
}
