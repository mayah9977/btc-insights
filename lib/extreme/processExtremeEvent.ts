import { safeExtremeScore } from './extremeScoreSafe';
import { extremeToNotification } from './extremeToNotification';
import {
  pushExtremeHistory,
  getAverageReliability,
} from './extremeHistoryStore';
import { checkAndLogStableZone } from './stableZoneLogStore';

import { canSendNotification } from '@/lib/notification/notificationCooldown';
import { pushNotification } from '@/lib/notification/notificationQueue';

import type { ExtremeEvent } from './extremeToNotification';

/**
 * 🔥 Extreme 이벤트 처리 메인 함수 (SSOT)
 *
 * 책임:
 * 1. 점수 안정화
 * 2. Extreme → Notification 변환
 * 3. Extreme 신뢰도 히스토리 기록
 * 4. Stable Zone 자동 진입 로그 기록 (중요)
 * 5. 쿨다운 검사 후 Notification 발행
 */
export function processExtremeEvent(
  rawEvent: ExtremeEvent
) {
  /**
   * 1️⃣ 점수 안정화
   * - NaN / Infinity / 이상치 방어
   */
  const score = safeExtremeScore(rawEvent.score);

  /**
   * 2️⃣ Notification 후보 생성
   */
  const notif = extremeToNotification({
    ...rawEvent,
    score,
  });

  /**
   * 3️⃣ Extreme 신뢰도 히스토리 기록
   * - 그래프 / 평균 신뢰도 / VIP Dashboard 근거
   */
  if (notif?.reliability !== undefined) {
    pushExtremeHistory(notif.reliability);
  }

  /**
   * 4️⃣ Stable Zone 자동 진입 로그 (🔥 핵심 1줄)
   * - 평균 신뢰도 기준으로 안정 구간 진입/이탈 기록
   */
  checkAndLogStableZone(getAverageReliability());

  /**
   * 5️⃣ Notification 발행 (쿨다운 포함)
   */
  if (notif && canSendNotification(notif)) {
    pushNotification(notif);
  }
}
