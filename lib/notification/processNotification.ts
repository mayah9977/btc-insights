import type { NotificationItem } from './notificationTypes';
import { playNotificationFeedback } from './notificationFeedback';
import { recordNotification } from './notificationHistoryStore';

/**
 * 🔔 Notification 처리 유닛 (SSOT - UI 소비 단계)
 *
 * 책임:
 * 1. Notification 히스토리 기록
 * 2. VIP3 전용 음성/진동 피드백
 * 3. (향후) 분석 / 서버 로깅 확장 지점
 */
export function processNotification(
  item: NotificationItem,
  opts: {
    isVIP3: boolean;
  }
) {
  /**
   * 1️⃣ Notification 기록 (중요)
   * - Notification History / 통계 / VIP Dashboard의 근거 데이터
   * - UI 렌더링 여부와 무관하게 항상 기록
   */
  recordNotification(item);

  /**
   * 2️⃣ VIP3 전용 피드백
   * - CRITICAL / WARNING 레벨에서만 강한 피드백 가능
   */
  playNotificationFeedback(item.level, opts.isVIP3);

  /**
   * 3️⃣ 확장 포인트 (현재 미사용)
   *
   * - 서버 로그 전송
   * - 사용자 행동 분석 (CTR, 반응 속도)
   * - 헤더/탭 배지 카운트 증가
   * - VIP 유지/이탈 신호 분석
   */
}
